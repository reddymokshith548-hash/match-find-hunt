import { Check, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useCheckout } from "@/hooks/useCheckout";
import { usePlan } from "@/hooks/usePlan";

type PlanKey = "monthly" | "halfyear";

const FREE_FEATURES = [
  { icon: Check, label: "10 swipes per day" },
  { icon: Check, label: "Basic FounderSync matches" },
  { icon: Check, label: "Browse Spark Rooms (read-only)" },
  { icon: Check, label: "Chat with mutual matches (after Mutual NDA)" },
];

const STARTER_FEATURES = [
  "Unlimited swipes & matches per day",
  "FounderSync personality test (full 30 questions)",
  "Unlimited Spark Rooms (create + message)",
  "Verified badge on your profile",
  "Read receipts & typing indicators",
  "Priority support",
];

const PRO_EXTRA_FEATURES = [
  "FounderSync Intelligence Engine — deep compatibility breakdown",
  "Priority placement in the matchmaking queue",
  "See who liked you",
  "Advanced match filters (stage, role, skills, location)",
  "AI match summaries on every profile",
];

const Pricing = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PlanKey>("halfyear");
  const [searchParams, setSearchParams] = useSearchParams();
  const { startCheckout, loading } = useCheckout();
  const { plan: currentPlan } = usePlan();

  useEffect(() => {
    const status = searchParams.get("checkout");
    if (status === "cancelled") {
      toast.info("Checkout cancelled", {
        description: "No charges were made. You can upgrade anytime.",
      });
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubscribe = (planKey: PlanKey) => {
    const stripePlan = planKey === "halfyear" ? "pro" : "starter";
    if (currentPlan === stripePlan || (currentPlan === "pro" && stripePlan === "starter")) {
      toast.info("You're already on this plan");
      return;
    }
    void startCheckout(stripePlan);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Header */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Lexach Pro
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
              Choose your <span className="gradient-text">Plan</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Find your co-founder faster. Unlock unlimited matches, deeper
              compatibility insights, and priority placement.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mt-8">
            {/* Monthly Plan */}
            <Card
              variant="profile"
              className={`relative p-8 cursor-pointer transition-all ${
                selected === "monthly"
                  ? "ring-2 ring-primary/40 shadow-lg"
                  : "hover:ring-1 hover:ring-border"
              }`}
              onClick={() => setSelected("monthly")}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Starter</h3>
                  <p className="text-sm text-muted-foreground">
                    Try Pro for a month. Cancel anytime.
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight">₹499</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Everything in Free, plus:
                  </p>
                  <ul className="space-y-3">
                    {STARTER_FEATURES.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={loading === "starter"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe("monthly");
                  }}
                >
                  {loading === "starter" ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting…</>
                  ) : currentPlan === "starter" ? "Current plan" : "Get Started"}
                </Button>
              </div>
            </Card>

            {/* 6-Month Plan (recommended) */}
            <Card
              variant="profile"
              className={`relative p-8 cursor-pointer transition-all bg-gradient-to-br from-primary/5 via-background to-background ${
                selected === "halfyear"
                  ? "ring-2 ring-primary shadow-2xl shadow-primary/20"
                  : "hover:ring-1 hover:ring-primary/40"
              }`}
              onClick={() => setSelected("halfyear")}
            >
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-md">
                Best Value · Save 67%
              </Badge>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Pro · 6 Months</h3>
                  <p className="text-sm text-muted-foreground">
                    Everything in Starter — at one-third the price.
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg text-muted-foreground line-through">
                      ₹2,994
                    </span>
                    <span className="text-5xl font-bold tracking-tight">₹999</span>
                    <span className="text-muted-foreground">/ 6 months</span>
                  </div>
                  <p className="text-xs text-primary mt-1 font-medium">
                    Just ₹166/month — billed once
                  </p>
                </div>

                <div className="h-px bg-border" />

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                    Everything in Starter, plus:
                  </p>
                  <ul className="space-y-3">
                    {PRO_EXTRA_FEATURES.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={loading === "pro"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe("halfyear");
                  }}
                >
                  {loading === "pro" ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting…</>
                  ) : currentPlan === "pro" ? "Current plan" : "Upgrade to Pro"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Free tier reference */}
          <div className="mt-10 max-w-3xl mx-auto">
            <Card className="p-6 bg-muted/30">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-lg">Free tier</h4>
                  <p className="text-sm text-muted-foreground">
                    Always free. No card required.
                  </p>
                </div>
                <Badge variant="secondary">₹0</Badge>
              </div>
              <ul className="grid sm:grid-cols-2 gap-2">
                {FREE_FEATURES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Prices in INR. GST included where applicable. Secure payments coming
            soon — your subscription auto-renews unless cancelled.
          </p>

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                Frequently asked questions
              </h2>
              <p className="text-muted-foreground">
                Everything you need to know about Lexach Pro.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="refunds">
                <AccordionTrigger className="text-left">
                  Do you offer refunds?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. We offer a <strong>7-day no-questions-asked refund</strong> on
                  your first Pro purchase — both the ₹499 monthly and ₹999 6-month
                  plans. After 7 days, refunds are reviewed case-by-case. Email{" "}
                  <span className="text-foreground">support@lexach.com</span> with
                  your order ID and we'll process eligible refunds within 5–7
                  business days back to your original payment method.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="cancellation">
                <AccordionTrigger className="text-left">
                  How do I cancel my subscription?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Cancel anytime from <strong>Settings → Billing</strong> in one
                  click — no calls, no forms. Your Pro features stay active until
                  the end of your current billing period (the rest of the month
                  for Starter, or the rest of the 6 months for Pro). After that
                  you automatically move to the Free tier. We never charge a
                  cancellation fee.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="downgrade-matches">
                <AccordionTrigger className="text-left">
                  What happens to my matches and chats if I downgrade?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>
                    <strong>Nothing is deleted.</strong> All your existing
                    connections, signed NDAs, chat history, and Spark Room
                    memberships stay exactly as they are.
                  </p>
                  <p>What changes on the Free tier:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Daily swipes drop back to 10 per day</li>
                    <li>"Who liked you" and advanced filters are hidden</li>
                    <li>You can still chat with everyone you're already connected to</li>
                    <li>Spark Rooms become read-only (you can browse but not post)</li>
                  </ul>
                  <p>Upgrade again anytime to instantly restore everything.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="gst-invoicing">
                <AccordionTrigger className="text-left">
                  Is GST included? Can I get a tax invoice?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-2">
                  <p>
                    Yes — all listed prices (₹499 and ₹999) are{" "}
                    <strong>inclusive of 18% GST</strong>. No hidden charges at
                    checkout.
                  </p>
                  <p>
                    A GST-compliant tax invoice is emailed to you automatically
                    after every successful payment. If you're a registered
                    business and want your <strong>GSTIN</strong> on the invoice,
                    add it under{" "}
                    <strong>Settings → Billing → Business details</strong> before
                    paying, and it'll appear on all future invoices. Download
                    past invoices anytime from the same screen.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-methods">
                <AccordionTrigger className="text-left">
                  What payment methods do you accept?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Once checkout goes live, we'll accept UPI, all major Indian
                  credit & debit cards (Visa, Mastercard, RuPay, Amex), net
                  banking, and popular wallets. Payments are processed securely
                  — Lexach never stores your card details.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
