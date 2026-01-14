import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Github } from "lucide-react"
import { SettingsPanel } from "@/components/settings-panel"
import { PeopleManager } from "@/components/people-manager"
import { ReceiptGrid } from "@/components/receipt-grid"
import { SplitPreview } from "@/components/split-preview"
import { UploadModal } from "@/components/upload-modal" // Coming next


function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden">
        {/* Elegant gradient overlay */}
        <div className="fixed inset-0 bg-gradient-to-br from-primary/3 via-transparent to-primary/3 pointer-events-none" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <div className="container flex h-16 items-center justify-between px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 font-bold text-lg sm:text-xl">
              <img src="/icon_64.png" alt="Eazy Split" className="w-9 h-9 rounded-xl shadow-lg shadow-primary/20" />
              <span className="hidden xs:inline text-foreground">Eazy Split</span>
              <span className="xs:hidden text-foreground">Eazy Split</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <PeopleManager />
              <UploadModal />
              <SettingsPanel />
              <a
                href="https://github.com/ayush1920/Eazy-Split"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center items-center rounded-xl border-2 border-border bg-background p-2.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-[#FD366E] focus:outline-none focus:ring-2 focus:ring-[#FD366E] focus:ring-offset-2 transition-all duration-200 group"
                aria-label="View on GitHub"
              >
                <Github className="h-[1.2rem] w-[1.2rem]" />
              </a>
              <ModeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 container px-4 sm:px-6 max-w-7xl mx-auto py-8 grid lg:grid-cols-[1fr_320px] gap-8 relative z-10">
          <div className="min-w-0">
            <ReceiptGrid />
          </div>
          <div className="lg:block">
            <SplitPreview />
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App
