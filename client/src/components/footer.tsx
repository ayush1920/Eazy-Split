
import { Github } from "lucide-react"

export function Footer() {
    return (
        <footer className="py-6 md:px-8 md:py-0 border-t border-border/40 mt-auto">
            <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row max-w-7xl mx-auto">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground">
                    Built with ❤️ by{" "}
                    <a
                        href="https://github.com/ayush1920"
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
                    >
                        Ayush Kumar
                    </a>
                    .
                </p>
                <div className="flex items-center gap-1">
                    <a
                        href="https://github.com/ayush1920/Eazy-Split"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                        <Github className="mr-2 h-4 w-4" />
                        GitHub
                    </a>
                </div>
            </div>
        </footer>
    )
}
