import { prisma } from "@/lib/prisma";

export class DonorTrackingService {
  /**
   * Retrieves the detailed breakdown of where a specific donor's funds were allocated.
   * This handles the multi-donor to single loan tracking logic.
   * 
   * @param donorId The UUID of the authenticated donor user
   * @param limit Optional limit for pagination/recent views
   */
  static async getDonorDistributions(params: {
    donorId?: string;
    start?: number;
    end?: number;
    status?: string;
    search?: string;
    limit?: number; // kept for backwards compatibility if needed
  }) {
    const { donorId, start, end, status, search, limit } = params;

    const whereClause: any = {
      fundings: {
        some: {
          sourceType: "DONOR",
          ...(donorId ? { donorFund: { donorId: donorId } } : {}),
          ...(status ? { status } : {}),
        }
      }
    };

    if (search) {
      whereClause.application = {
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { borrower: { name: { contains: search, mode: 'insensitive' } } }
        ]
      };
    }

    const take = limit ?? ((start !== undefined && end !== undefined) ? end - start : undefined);
    const skip = start !== undefined ? start : undefined;
    
    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where: whereClause,
        include: {
          application: {
            include: {
              borrower: {
                select: {
                  name: true,
                  image: true
                }
              }
            }
          },
          fundings: {
            where: {
              sourceType: "DONOR",
              ...(donorId ? { donorFund: { donorId: donorId } } : {}),
            },
            select: {
              amount: true,
              status: true,
              id: true,
            }
          }
        },
        orderBy: {
          approvedAt: "desc"
        },
        take,
        skip
      }),
      prisma.loan.count({ where: whereClause })
    ]);

    // Map the database response to the API contract format
    const distributions = loans.map(loan => {
      const application = loan.application;
      const borrower = application.borrower;
      
      // Since all fundings for the same loan/donor will transition status together
      // we can just take the status of the first one
      const representativeStatus = loan.fundings[0]?.status || "ALLOCATED";
      const totalAllocated = loan.fundings.reduce((sum, f) => sum + Number(f.amount), 0);
      const representativeId = loan.fundings[0]?.id || loan.id;

      return {
        id: representativeId,
        loanId: loan.id,
        beneficiaryName: borrower.name,
        description: application.description,
        allocatedAmount: totalAllocated,
        allocatedAt: loan.approvedAt.toISOString(),
        status: representativeStatus
      };
    });

    return { distributions, total };
  }
}
