import { useState } from "react";

export default function Drawer(props : { question : string, answer : string}) {

    const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      
      {/* Trigger Header Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex justify-between items-center px-6 py-4 bg-slate-50 hover:bg-slate-100/70 text-slate-700 font-semibold text-sm transition-colors cursor-pointer outline-none select-none"
      >
        <span>{props.question}</span>
        
        {/* Chevron Icon with smooth rotation */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-in-out ${
            isOpen ? 'rotate-180 text-slate-700' : 'rotate-0'
          }`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Smooth CSS Grid Dropdown Container */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        {/* Inner wrapper needs overflow-hidden to prevent contents from spilling when closed */}
        <div className="overflow-hidden">
          <div className="p-6 border-t border-slate-100 bg-white text-sm text-slate-600 leading-relaxed">
            {props.answer}
          </div>
        </div>
      </div>
    </div>
  );
}