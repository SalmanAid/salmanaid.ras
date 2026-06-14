import { prisma } from "@/lib/prisma";
import { DonationInput } from "@/schemas/donations.schema";
import { randomUUID } from "crypto";
import { DonorTrackingService } from "./donor-tracking.service";

type DistributionStatus = "Pending" | "Distributed";

type DonorDashboardDistribution = {
  id: string;
  date: string;
  programName: string;
  amount: number;
  status: DistributionStatus;
};

const QUICK_SELECT_AMOUNTS = [1000000, 5000000, 10000000];

const rankFromTotalDonation = (totalDonation: number) => {
  if (totalDonation >= 50000000) return "Platinum Donor";
  if (totalDonation >= 20000000) return "Gold Donor";
  if (totalDonation >= 5000000) return "Silver Donor";
  return "Bronze Donor";
};

const mapDistributionStatus = (amount: number, remaining: number): DistributionStatus => {
  return remaining >= amount ? "Pending" : "Distributed";
};

export const DonationService = {
  async createDonation(userId: string, data: DonationInput) {
    return await prisma.$transaction(async (tx) => {
      const donorFund = await tx.donorFund.create({
        data: {
          donorId: userId,
          amount: data.amount,
          remaining: data.amount,
        },
      });

      const payment = await tx.paymentTransaction.create({
        data: {
          externalId: `DON-${Date.now()}-${randomUUID().slice(0, 5)}`,
          referenceId: donorFund.id,
          category: "DONATION",
          amount: data.amount,
          paymentType: data.paymentType,
          status: "PENDING",
          response: {},
        },
      });

      return { donorFund, payment };
    });
  },

  async getDonations() {
    try {
      const donations = await prisma.donorFund.findMany({
        where: {
          remaining: { gt: 0 },
        },
        select: {
          id: true,
          donorId: true,
          amount: true,
          remaining: true,
          donor: {
            select: {
              name: true,
              image: true,
            },
          },
          paymentTransaction: {
            select: {
              paymentType: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      type GroupedDonation = {
        id: string;
        name: string | null;
        image: string | null;
        available: number;
        totalAmount: number;
        fund: string;
      };
      const groupedDonations = new Map<string, GroupedDonation>();
      for (const d of donations) {
        if (!d.donorId || !d.donor) continue;
        const existing = groupedDonations.get(d.donorId);
        if (existing) {
          existing.available += Number(d.remaining);
          existing.totalAmount += Number(d.amount);
        } else {
          groupedDonations.set(d.donorId, {
            id: d.donorId, // We map the donorId to id for the frontend
            name: d.donor.name,
            image: d.donor.image,
            available: Number(d.remaining),
            totalAmount: Number(d.amount),
            fund: d.paymentTransaction?.paymentType || "Donasi Umum",
          });
        }
      }

      return {
        donations: Array.from(groupedDonations.values()),
      };
    } catch (error) {
      console.error("Error fetching donor funds:", error);
      throw new Error("Gagal mengambil data dana donor.");
    }
  },

  async getDonorDashboard(userId: string) {
    try {
      const donorFunds = await prisma.donorFund.findMany({
        where: {
          donorId: userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          amount: true,
          remaining: true,
          createdAt: true,
          loanFundings: {
            select: {
              id: true,
            },
          },
          paymentTransaction: {
            select: {
              paymentType: true,
            },
          },
        },
        take: 50,
      });

      const summarySeed = donorFunds.reduce(
        (acc, fund) => {
          const amount = Number(fund.amount);
          const remaining = Number(fund.remaining);
          const allocated = Math.max(amount - remaining, 0);

          acc.totalDonated += amount;
          acc.totalAllocated += allocated;

          if (allocated > 0 || fund.loanFundings.length > 0) {
            acc.activeImpact += 1;
          }

          return acc;
        },
        {
          totalDonated: 0,
          totalAllocated: 0,
          activeImpact: 0,
        }
      );

      const { distributions: recentDistributions } = await DonorTrackingService.getDonorDistributions({
        donorId: userId,
        limit: 5,
      });

      return {
        summary: {
          totalDonated: summarySeed.totalDonated,
          activeImpact: summarySeed.activeImpact,
          undistributedBalance: Math.max(summarySeed.totalDonated - summarySeed.totalAllocated, 0),
          currentRank: rankFromTotalDonation(summarySeed.totalDonated),
        },
        recentDistributions: recentDistributions.map((d: any) => ({
          id: d.id,
          date: d.allocatedAt,
          programName: d.description,
          amount: d.allocatedAmount,
          status: d.status === "RETURNED" ? "Distributed" : "Pending",
        })),
        quickSelectAmounts: QUICK_SELECT_AMOUNTS,
      };
    } catch (error) {
      console.error("Error fetching donor dashboard:", error);
      throw new Error("Gagal mengambil data dashboard donor.");
    }
  },
};