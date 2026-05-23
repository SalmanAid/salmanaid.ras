import { useRouter } from "next/navigation";

interface ProgramDetailProps {
  title: string;
  caption: string;
  terms: string[]; // Fixed tuple definition to standard string array
  url: string;
}

export default function ProgramDetailComponent({ title, caption, terms, url }: ProgramDetailProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col bg-white border border-slate-100 rounded-3xl p-6 shadow-sm max-w-xl mx-auto text-slate-800">
      
      {/* Title Section */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#FCB82E]">Detail Program : {title}</h2>
      </div>

      {/* Caption Section */}
      <p className="text-sm text-slate-500 leading-relaxed mb-6">
        {caption}
      </p>

      {/* Terms and Conditions Section */}
      <div className="border-t border-slate-50 py-4">
        <h3 className="font-bold text-sm text-slate-600 mb-3">
          Syarat Dan Ketentuan
        </h3>

        {/* Content Terms and Conditions */}
        <div className="flex flex-col gap-2.5">
          {terms && terms.map((term, index) => (
            // Fixed: Changed from forEach to map, and explicitly returning the JSX container
            <div key={index} className="flex items-start gap-2.5 text-sm text-slate-600">
              
              {/* Checklist Icon */}
              <div className="flex items-center justify-center min-w-4.5 h-4.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] mt-0.5">
                ✓
              </div>

              {/* Term String */}
              <div className="flex-1 leading-tight">
                {term}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* cta */}
      <div className="flex justify-center items-center w-full h-fit p-2 font-semibold rounded-2xl bg-[#FCB82E] text-white" onClick={() => router.push(url)}>
        Ajukan Sekarang
      </div>
      
    </div>
  );
}