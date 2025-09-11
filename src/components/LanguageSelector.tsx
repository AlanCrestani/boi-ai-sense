import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export interface Language {
  code: string;
  name: string;
  region: string;
  flag: string;
  fallback: string;
}

const languages: Language[] = [
  {
    code: "pt-BR",
    name: "Português",
    region: "Brasil",
    flag: "data:image/svg+xml,%3csvg%20height='20'%20viewBox='0%200%2028%2020'%20width='28'%20xmlns='http://www.w3.org/2000/svg'%3e%3crect%20width='28'%20height='20'%20fill='%23009c3b'/%3e%3ccircle%20cx='14'%20cy='10'%20r='7'%20fill='%23ffdf00'/%3e%3cpath%20d='M7%2010a7%207%200%201%201%2014%200%207%207%200%200%201-14%200'%20fill='%23002776'/%3e%3cpath%20d='M14%207.5a2.5%202.5%200%201%200%200%205%202.5%202.5%200%200%200%200-5'%20fill='%23009c3b'/%3e%3c/svg%3e",
    fallback: "BR"
  },
  {
    code: "es-PY",
    name: "Español",
    region: "Paraguay",
    flag: "data:image/svg+xml,%3csvg%20height='20'%20viewBox='0%200%2028%2020'%20width='28'%20xmlns='http://www.w3.org/2000/svg'%3e%3crect%20width='28'%20height='6.67'%20fill='%23D52B1E'/%3e%3crect%20width='28'%20height='6.67'%20y='6.67'%20fill='%23fff'/%3e%3crect%20width='28'%20height='6.67'%20y='13.33'%20fill='%23005496'/%3e%3ccircle%20cx='14'%20cy='10'%20r='3'%20fill='%23F7E000'%20stroke='%23009639'%20stroke-width='0.5'/%3e%3c/svg%3e",
    fallback: "PY"
  },
  {
    code: "en-US",
    name: "English",
    region: "United States",
    flag: "data:image/svg+xml,%3csvg%20height='20'%20viewBox='0%200%2028%2020'%20width='28'%20xmlns='http://www.w3.org/2000/svg'%3e%3crect%20width='28'%20height='20'%20fill='%23B22234'/%3e%3cpath%20d='M0%202h28v2H0zM0%206h28v2H0zM0%2010h28v2H0zM0%2014h28v2H0zM0%2018h28v2H0z'%20fill='%23fff'/%3e%3crect%20width='12'%20height='11'%20fill='%233C3B6E'/%3e%3c/svg%3e",
    fallback: "US"
  }
];

export function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]); // Default to Portuguese Brazil

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-background-secondary/50">
          <Avatar className="w-5 h-5">
            <AvatarImage src={selectedLanguage.flag} alt={selectedLanguage.name} />
            <AvatarFallback className="text-xs">{selectedLanguage.fallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-card-primary border-border-subtle z-50">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setSelectedLanguage(language)}
            className="flex items-center gap-3 p-3 cursor-pointer"
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={language.flag} alt={language.name} />
              <AvatarFallback className="text-xs">{language.fallback}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-text-primary">{language.name}</span>
              <span className="text-xs text-text-secondary">{language.region}</span>
            </div>
            {selectedLanguage.code === language.code && (
              <div className="ml-auto w-2 h-2 bg-accent-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}