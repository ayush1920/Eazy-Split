import { useMemo, useState } from 'react';
import { useReceiptStore } from '@/store/useReceiptStore';
import { usePeopleStore } from '@/store/usePeopleStore';
import { calculateSplits } from '@/lib/splitter';
import { generateExportText } from '@/lib/export';
import { motion } from 'framer-motion';
import { Copy, FileDown } from 'lucide-react';

export function SplitPreview() {
    const { groups, splits } = useReceiptStore();
    const { people } = usePeopleStore();
    const [copied, setCopied] = useState(false);

    const allItems = useMemo(() => groups.flatMap(g => g.items), [groups]);

    const result = useMemo(() => {
        return calculateSplits(allItems, splits, people);
    }, [allItems, splits, people]);

    const handleCopy = () => {
        const text = generateExportText(groups, splits, people, 'text');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const text = generateExportText(groups, splits, people, 'markdown');
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-split-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="w-full max-w-5xl mx-auto mt-8 mb-20 lg:mb-0 lg:sticky lg:top-24">
            <div className="group bg-card border-2 border-border rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:border-[#FD366E] transition-all duration-300">
                <h3 className="font-bold mb-6 text-xl text-foreground group-hover:text-[#FD366E] transition-colors duration-300">Split Summary</h3>

                <div className="space-y-3">
                    {people.length === 0 && <p className="text-sm text-muted-foreground">Add people to see splits.</p>}

                    {people.map(person => (
                        <motion.div
                            key={person.id}
                            layout
                            className="flex justify-between items-center text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                    {person.name.substring(0, 2).toUpperCase()}
                                </div>
                                <span>{person.name}</span>
                            </div>
                            <span className="font-mono font-medium">₹{result.personTotals[person.id]?.toFixed(2)}</span>
                        </motion.div>
                    ))}

                    {result.unassignedTotal > 0 && (
                        <div className="flex justify-between items-center text-sm text-destructive font-medium border-t border-border pt-2 mt-2">
                            <span>Unassigned</span>
                            <span>₹{result.unassignedTotal.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center text-base font-bold border-t-2 border-border pt-3 mt-2">
                        <span>Total</span>
                        <span>₹{result.grandTotal.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8 pt-6 border-t border-border/50">
                    <button
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-[#FD366E] hover:text-white border-2 border-transparent text-secondary-foreground text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-[0.98] shadow-sm hover:shadow-lg"
                    >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy Text'}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-[#FD366E] hover:text-white border-2 border-transparent text-secondary-foreground text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-[0.98] shadow-sm hover:shadow-lg"
                    >
                        <FileDown className="w-4 h-4" />
                        Export MD
                    </button>
                </div>
            </div>
        </div>
    );
}
