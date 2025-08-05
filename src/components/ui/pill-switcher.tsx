import { motion } from "framer-motion";

interface PillSwitcherProps {
  activeTab: string;
  onChange: (tab: string) => void;
  lessonCount: number;
  emailCount: number;
}

export function PillSwitcher({ activeTab, onChange, lessonCount, emailCount }: PillSwitcherProps) {
  const options = [
    { key: "lessons", label: "Lessons", count: lessonCount },
    { key: "emails", label: "Emails", count: emailCount }
  ];

  return (
    <div className="relative w-fit mx-auto">
      {/* Gradient border container */}
      <div className="p-[1px] rounded-full bg-gradient-to-r from-[#22DFDC] to-[#22EDB6]">
        {/* Inner container with darker background to match lesson cards */}
        <div className="relative rounded-full bg-neutral-950/90 backdrop-blur-sm p-1 flex">
          {options.map((option) => (
            <button
              key={option.key}
              className={`relative z-10 flex items-center gap-3 px-6 py-3 font-medium rounded-full transition-all duration-200 ${
                activeTab === option.key 
                  ? "text-white bg-white/10" 
                  : "text-white/70 hover:text-white/90 hover:bg-white/5"
              }`}
              onClick={() => onChange(option.key)}
            >
              <span className="text-base font-medium">{option.label}</span>
              <span className="text-sm font-semibold text-white/60 bg-white/10 px-2 py-1 rounded-full min-w-[24px] text-center">
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#22DFDC]/20 to-[#22EDB6]/20 blur-sm -z-10" />
    </div>
  );
}