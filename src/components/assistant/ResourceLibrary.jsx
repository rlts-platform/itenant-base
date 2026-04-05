import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Search, Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORY_COLORS = {
  Legal: "bg-blue-100 text-blue-700",
  Maintenance: "bg-orange-100 text-orange-700",
  Finance: "bg-emerald-100 text-emerald-700",
  Leasing: "bg-violet-100 text-violet-700",
  "Tenant Relations": "bg-pink-100 text-pink-700",
};

const ARTICLES = [
  { id: "legal-1", category: "Legal", title: "Security Deposit Laws by State", preview: "State-by-state overview of maximum deposit amounts, return deadlines, and required disclosures.", body: `Security deposits are regulated at the state level. Key rules vary widely:\n\n• Maximum amounts: Many states cap deposits at 1-2 months' rent (e.g., California: 2x for unfurnished, 3x for furnished). Some states have no cap.\n• Return timeline: Ranges from 14 days (e.g., Georgia) to 45 days (e.g., Alabama) after move-out.\n• Itemized deductions: Most states require a written itemization of any deductions.\n• Interest: Some states (e.g., New York, Massachusetts) require deposits to be held in interest-bearing accounts.\n• Failure to comply: Landlords who violate deposit laws can face penalties of 2-3x the deposit amount.\n\nAlways consult a local attorney for your specific state's requirements.` },
  { id: "legal-2", category: "Legal", title: "Eviction Process Overview", preview: "Step-by-step guide to the eviction process, required notices, and court procedures.", body: `The eviction process (also called unlawful detainer) generally follows these steps:\n\n1. Serve proper written notice (Pay or Quit, Cure or Quit, or Unconditional Quit) with the legally required notice period.\n2. If tenant doesn't comply, file an eviction lawsuit in local court.\n3. Serve the tenant with the lawsuit summons.\n4. Attend the court hearing — bring documentation of lease, notices, and violations.\n5. If the court rules in your favor, obtain a Writ of Possession.\n6. The sheriff or marshal enforces the writ and removes the tenant.\n\nSelf-help evictions (changing locks, removing belongings) are illegal in all states and can expose landlords to significant liability.` },
  { id: "legal-3", category: "Legal", title: "Fair Housing Act Compliance", preview: "Understanding prohibited discrimination and required accommodations under federal law.", body: `The Fair Housing Act prohibits discrimination based on race, color, national origin, religion, sex, familial status, and disability in any housing-related transaction.\n\nKey compliance points:\n• Advertising: Never include language that indicates preference or limitation based on protected classes.\n• Screening: Apply consistent criteria to all applicants. Document your process.\n• Reasonable accommodations: You must allow disabled tenants to make reasonable modifications and provide reasonable accommodations (e.g., reserved parking, assistance animals).\n• Familial status: You cannot refuse to rent to families with children under 18 (with narrow exceptions for 55+ communities).\n\nMany states and cities have additional protected classes. Violations can result in HUD complaints, civil lawsuits, and substantial fines.` },
  { id: "maint-1", category: "Maintenance", title: "Winter Preparation Checklist", preview: "Essential maintenance tasks to protect your property before temperatures drop.", body: `Complete these tasks before winter:\n\n🔥 Heating\n• Schedule HVAC service and replace filters\n• Test all heating systems and thermostats\n• Bleed radiators if applicable\n\n💧 Plumbing\n• Insulate exposed pipes in unheated areas\n• Disconnect and drain outdoor hoses\n• Locate and test main water shutoffs\n• Service water heaters\n\n🏠 Exterior\n• Clean and inspect gutters and downspouts\n• Seal gaps around windows and doors (weatherstripping, caulk)\n• Inspect roof for damaged shingles\n• Test smoke and CO detectors — replace batteries\n\n⚡ Electrical\n• Check GFCI outlets in kitchens and baths\n• Test circuit breakers\n\n🌿 Landscaping\n• Winterize irrigation systems\n• Trim trees away from power lines and rooflines` },
  { id: "maint-2", category: "Maintenance", title: "Preventive Maintenance Schedule", preview: "Monthly, quarterly, and annual property maintenance tasks to prevent costly repairs.", body: `Monthly:\n• Replace HVAC filters\n• Test smoke/CO detectors\n• Check for water leaks under sinks\n• Inspect fire extinguishers\n\nQuarterly:\n• Clean dryer vents\n• Flush water heater (remove sediment)\n• Check caulking in bathrooms and kitchen\n• Inspect plumbing for slow drains\n• Test all GFCIs\n\nAnnually:\n• HVAC full service\n• Roof and gutter inspection\n• Pest inspection\n• Check attic insulation\n• Service garage doors\n• Inspect foundation for cracks\n• Test sump pump\n• Check window and door seals\n• Repaint exterior trim as needed` },
  { id: "maint-3", category: "Maintenance", title: "Handling Emergency Maintenance", preview: "How to prioritize and respond to urgent maintenance requests from tenants.", body: `Emergency maintenance (respond within 24 hours):\n• No heat in cold weather\n• Flooding or major water leaks\n• Gas leaks (call utility company immediately)\n• Sewage backup\n• Complete electrical outage\n• Broken locks/security issues\n\nUrgent (respond within 48-72 hours):\n• Refrigerator/stove failure\n• Hot water heater failure\n• HVAC failure in extreme heat\n• Pest infestation\n\nResponse tips:\n1. Have a 24/7 emergency contact for tenants\n2. Maintain a vetted vendor list for all categories\n3. Document all requests and responses in writing\n4. Know your state's habitability laws — failure to maintain habitable conditions can give tenants legal remedies including rent withholding` },
  { id: "fin-1", category: "Finance", title: "Rental Property Tax Deductions", preview: "Common deductions landlords can take to reduce their taxable rental income.", body: `Deductible expenses for rental properties:\n\n✅ Mortgage interest\n✅ Property taxes\n✅ Insurance premiums\n✅ Repairs and maintenance (not improvements)\n✅ Property management fees\n✅ Advertising and leasing costs\n✅ Professional fees (attorney, accountant)\n✅ Travel to property for management purposes\n✅ Utilities you pay\n✅ Depreciation (residential: 27.5-year straight-line)\n\n⚠️ Capital improvements must be depreciated, not expensed in a single year.\n⚠️ Passive activity loss rules may limit deductions depending on your income.\n\nConsult a CPA familiar with real estate investing for a strategy tailored to your portfolio.` },
  { id: "fin-2", category: "Finance", title: "Calculating ROI on a Rental Property", preview: "Key metrics: cap rate, cash-on-cash return, and gross rent multiplier explained.", body: `Key rental property metrics:\n\n📊 Cap Rate = Net Operating Income / Property Value\n• NOI = Gross rents − operating expenses (not including mortgage)\n• A cap rate of 6-10% is generally considered good depending on market\n\n💵 Cash-on-Cash Return = Annual Cash Flow / Total Cash Invested\n• Cash flow = Gross rents − all expenses including mortgage payments\n• Measures return on your actual cash invested\n\n📐 Gross Rent Multiplier (GRM) = Property Price / Annual Gross Rent\n• Lower GRM = better value\n• Useful for quick comparisons between properties\n\n🔑 The 1% Rule: Monthly rent ≥ 1% of purchase price suggests cash flow potential (rough heuristic only)` },
  { id: "lease-1", category: "Leasing", title: "Tenant Screening Best Practices", preview: "How to evaluate applicants fairly and reduce risk of problem tenancies.", body: `A strong screening process:\n\n1. Pre-screen: State income requirement upfront (typically 2.5-3x monthly rent)\n2. Application: Collect full name, SSN, employment, rental history, references\n3. Credit check: Look for score, payment history, collections, evictions. Use a service like TransUnion SmartMove.\n4. Background check: Criminal history per your local laws (ban-the-box laws may apply)\n5. Rental verification: Call previous landlords — ask if they'd rent to them again\n6. Employment verification: Request recent pay stubs or offer letter\n\nConsistency is key — apply the same criteria to every applicant and document your decisions. Keep records for at least 3 years.` },
  { id: "lease-2", category: "Leasing", title: "Lease Renewal Strategies", preview: "When and how to renew leases, handle rent increases, and retain good tenants.", body: `Best practices for lease renewals:\n\n• Timing: Send renewal offer 60-90 days before lease expiration\n• Rent increases: Research local market rates. A modest increase (3-5%) retains good tenants better than a large jump. Check if your area has rent stabilization.\n• Good tenant incentives: Small upgrades (fresh paint, new fixtures) can secure long-term renewals\n• Month-to-month: If tenants want flexibility, month-to-month allows rent adjustments with proper notice but reduces your stability\n• Non-renewal: Give required notice (typically 30-60 days) in writing if you don't plan to renew\n• Documentation: Always put renewal terms in writing — never rely on verbal agreements` },
  { id: "tenant-1", category: "Tenant Relations", title: "Handling Late Rent Professionally", preview: "Scripts and processes for collecting overdue rent while preserving tenant relationships.", body: `A tiered approach to late rent:\n\nDay 1-3 after due date:\n• Send a friendly reminder via text or email\n• "Hi [Name], just a reminder that rent was due on the 1st. Please let me know if you have any questions."\n\nDay 4-7:\n• Phone call and follow-up written notice\n• Reference the lease terms and late fee\n\nDay 8-14:\n• Formal written Late Rent Notice\n• State the amount owed including late fees\n• Give a cure deadline (typically 3-5 days)\n\nDay 15+:\n• Evaluate for Pay or Quit notice (required before eviction)\n• If tenant has been reliable, consider a payment plan in writing\n\nAlways document every communication. Never accept partial payment without a written agreement.` },
  { id: "tenant-2", category: "Tenant Relations", title: "Move-In and Move-Out Inspections", preview: "How to conduct thorough property inspections to protect your deposit and avoid disputes.", body: `Move-in inspection:\n• Conduct with tenant present before they move in\n• Use a room-by-room checklist: walls, floors, appliances, fixtures\n• Take date-stamped photos and video of every room\n• Both parties sign the completed checklist\n• Provide tenant a copy\n\nMove-out inspection:\n• Schedule within 24-48 hours of tenant vacating\n• Compare to move-in checklist and photos\n• Distinguish between normal wear and tear (not chargeable) and damage (chargeable)\n• Normal wear: minor scuffs, carpet wear in high-traffic areas, small nail holes\n• Damage: large holes, stains, broken fixtures\n\nDeposit deductions:\n• Itemize in writing within state-mandated timeframe\n• Provide receipts for repairs exceeding $X (varies by state)\n• Mail to last known address` },
];

const CATEGORIES = ["All", "Legal", "Maintenance", "Finance", "Leasing", "Tenant Relations"];

export default function ResourceLibrary() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [saved, setSaved] = useState([]);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (!user) return;
    base44.entities.SavedResource.filter({ user_email: user.email }).then(setSaved);
  }, [user]);

  const saveArticle = async (article) => {
    if (saving) return;
    setSaving(article.id);
    await base44.entities.SavedResource.create({
      user_email: user.email,
      article_id: article.id,
      title: article.title,
      category: article.category,
      preview: article.preview,
      body: article.body,
    });
    const updated = await base44.entities.SavedResource.filter({ user_email: user.email });
    setSaved(updated);
    setSaving(null);
  };

  const isSaved = (id) => saved.some(s => s.article_id === id);

  const filtered = ARTICLES.filter(a => {
    const matchCat = activeTab === "All" || a.category === activeTab;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.preview.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const ArticleCard = ({ article, expandable = true }) => {
    const isOpen = expanded === article.id;
    const alreadySaved = isSaved(article.id);
    return (
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[article.category] || "bg-secondary text-secondary-foreground"}`}>
              {article.category}
            </span>
            {expandable && (
              <button
                onClick={() => alreadySaved ? null : saveArticle(article)}
                title={alreadySaved ? "Saved" : "Save to library"}
                className={`p-1 rounded-lg transition-colors ${alreadySaved ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-accent"}`}
              >
                {alreadySaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            )}
          </div>
          <button className="w-full text-left" onClick={() => setExpanded(isOpen ? null : article.id)}>
            <h4 className="font-semibold text-sm mb-1 hover:text-primary transition-colors">{article.title}</h4>
            <p className="text-xs text-muted-foreground">{article.preview}</p>
          </button>
          {expandable && (
            <button onClick={() => setExpanded(isOpen ? null : article.id)} className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
              {isOpen ? <><ChevronUp className="w-3 h-3" />Collapse</> : <><ChevronDown className="w-3 h-3" />Read More</>}
            </button>
          )}
        </div>
        {isOpen && (
          <div className="px-4 pb-4 border-t border-border">
            <pre className="whitespace-pre-wrap text-xs text-foreground font-sans leading-relaxed pt-3">{article.body}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border shrink-0 space-y-3">
        <h2 className="font-semibold text-base">Resource Library</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search articles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setActiveTab(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeTab === c ? "bg-primary text-white" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No articles match your search.</p>
        )}
        {filtered.map(a => <ArticleCard key={a.id} article={a} />)}

        {saved.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 text-primary" /> My Saved Resources
            </h3>
            <div className="space-y-3">
              {saved.map(s => (
                <ArticleCard key={s.id} article={{ id: s.article_id, title: s.title, category: s.category, preview: s.preview, body: s.body }} expandable={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}