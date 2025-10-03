import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="relative transition-all duration-200 hover:scale-105"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">تبديل المظهر</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={`cursor-pointer flex items-center gap-2 ${theme === "light" ? "bg-accent" : ""}`}
        >
          <Sun className="h-4 w-4" />
          المظهر الفاتح
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={`cursor-pointer flex items-center gap-2 ${theme === "dark" ? "bg-accent" : ""}`}
        >
          <Moon className="h-4 w-4" />
          المظهر المظلم
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className={`cursor-pointer flex items-center gap-2 ${theme === "system" ? "bg-accent" : ""}`}
        >
          <Monitor className="h-4 w-4" />
          النظام
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// مكون بسيط للتبديل السريع (toggle button)
export function SimpleThemeToggle() {
  const { setTheme, theme } = useTheme()

  const handleToggle = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />
      case "dark":
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "فاتح"
      case "dark":
        return "مظلم"
      default:
        return "النظام"
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
    >
      {getIcon()}
      <span className="text-sm">{getLabel()}</span>
    </Button>
  )
}