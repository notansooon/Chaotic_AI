import React from "react";
import { ChevronDown, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const categories = [
  {
    section: "Technology",
    items: [
      { value: "web", label: "Web Development" },
      { value: "mobile", label: "Mobile Development" },
      { value: "ai", label: "AI & Machine Learning" },
      { value: "blockchain", label: "Blockchain" },
      { value: "iot", label: "Internet of Things" },
      { value: "ar-vr", label: "AR/VR" },
    ]
  },
  {
    section: "Design & Creative",
    items: [
      { value: "design", label: "UI/UX Design" },
      { value: "graphic", label: "Graphic Design" },
      { value: "animation", label: "Animation" },
      { value: "branding", label: "Branding" },
    ]
  },
  {
    section: "Business & Finance",
    items: [
      { value: "fintech", label: "Fintech" },
      { value: "ecommerce", label: "E-commerce" },
      { value: "marketing", label: "Marketing" },
      { value: "analytics", label: "Data Analytics" },
    ]
  },
  {
    section: "Infrastructure",
    items: [
      { value: "devops", label: "DevOps" },
      { value: "cloud", label: "Cloud Computing" },
      { value: "security", label: "Cybersecurity" },
      { value: "database", label: "Database" },
    ]
  },
  {
    section: "Emerging Tech",
    items: [
      { value: "robotics", label: "Robotics" },
      { value: "quantum", label: "Quantum Computing" },
      { value: "biotech", label: "Biotechnology" },
      { value: "clean-tech", label: "Clean Technology" },
    ]
  }
];

export default function CategoryDropdown({ selectedCategory, onCategoryChange }) {
  const getCurrentLabel = () => {
    if (selectedCategory === "all") return "All Categories";
    
    for (const section of categories) {
      const item = section.items.find(item => item.value === selectedCategory);
      if (item) return item.label;
    }
    return "All Categories";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-white">
          <Filter className="w-4 h-4 mr-2" />
          {getCurrentLabel()}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 max-h-[400px] overflow-y-auto" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="p-2">
          <DropdownMenuItem 
            onClick={() => onCategoryChange("all")}
            className={`cursor-pointer sticky top-0 bg-white z-10 ${
              selectedCategory === "all" ? "bg-blue-50 text-blue-700" : ""
            }`}
          >
            All Categories
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          <div className="space-y-1">
            {categories.map((section, sectionIndex) => (
              <div key={section.section}>
                <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-2 sticky top-8 bg-white/95 backdrop-blur-sm border-b border-slate-100">
                  {section.section}
                </DropdownMenuLabel>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <DropdownMenuItem
                      key={item.value}
                      onClick={() => onCategoryChange(item.value)}
                      className={`cursor-pointer ml-2 ${
                        selectedCategory === item.value ? "bg-blue-50 text-blue-700" : ""
                      }`}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </div>
                {sectionIndex < categories.length - 1 && (
                  <DropdownMenuSeparator className="my-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}