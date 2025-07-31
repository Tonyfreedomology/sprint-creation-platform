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
      {/* Main container */}
      <div className="relative rounded-full bg-black/30 backdrop-blur-sm p-1 flex">
        {options.map((option) => (
          <button
            key={option.key}
            className={`relative z-10 flex items-center gap-2 px-6 py-3 font-medium rounded-full transition-colors duration-200 ${
              activeTab === option.key 
                ? "text-white" 
                : "text-white/60 hover:text-white/80"
            }`}
            onClick={() => onChange(option.key)}
          >
            <span className="text-base font-medium">{option.label}</span>
            <span className="text-sm font-semibold bg-white/10 px-2 py-1 rounded-full">
              {option.count}
            </span>
            
            {/* Active indicator */}
            {activeTab === option.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-full bg-white/10"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Glowing gradient border */}
      <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-r from-[#22DFDC] to-[#22EDB6]">
        <div className="w-full h-full rounded-full bg-transparent" />
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#22DFDC]/20 to-[#22EDB6]/20 blur-sm -z-10" />
    </div>
  );
}