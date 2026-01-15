import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export function ModeToggle() {
    const { setTheme, resolvedTheme } = useTheme()

    const toggleTheme = () => {
        // Simple logic: If currently dark (system or manual), go light. Otherwise go dark.
        // This effectively cycles strictly between Light and Dark for manual control.
        if (resolvedTheme === 'dark') {
            setTheme('light')
        } else {
            setTheme('dark')
        }
    }

    return (
        <button
            onClick={toggleTheme}
            className="inline-flex justify-center items-center rounded-xl border-2 border-border bg-background p-2.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 group"
            aria-label="Toggle theme"
        >
            <div className="relative h-[1.2rem] w-[1.2rem]">
                <Sun
                    className={cn(
                        "absolute inset-0 h-[1.2rem] w-[1.2rem] transition-all duration-300",
                        resolvedTheme === 'dark' ? "rotate-90 scale-0" : "rotate-0 scale-100"
                    )}
                />
                <Moon
                    className={cn(
                        "absolute inset-0 h-[1.2rem] w-[1.2rem] transition-all duration-300",
                        resolvedTheme === 'dark' ? "rotate-0 scale-100" : "-rotate-90 scale-0"
                    )}
                />
            </div>
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
