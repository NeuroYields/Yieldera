import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  Bot,
  Clock,
  Shield,
  TrendingUp,
  Vault,
  Cpu,
  Zap,
  Target,
  DollarSign,
} from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      icon: Bot,
      question: "How does Yieldera's AI-powered optimization work?",
      answer:
        "Yieldera uses advanced machine learning algorithms that continuously analyze market conditions, liquidity pool performance, and yield opportunities across multiple DEXs. Our AI automatically adjusts your positions to capture the highest yields while minimizing risk, similar to how institutional trading firms operate but accessible to everyone.",
    },
    {
      icon: TrendingUp,
      question: "What makes Yieldera different from traditional yield farming?",
      answer:
        "Unlike manual yield farming where you have to constantly monitor markets and manually move funds, Yieldera automates the entire process. Our platform automatically rebalances positions, compounds rewards, harvests fees, and moves liquidity to the best opportunities 24/7. This eliminates the complexity and time commitment while maximizing your returns.",
    },
    {
      icon: Shield,
      question: "How does Yieldera protect against impermanent loss?",
      answer:
        "Yieldera's risk mitigation system uses smart algorithms to detect high-volatility conditions and automatically adjusts position ranges to minimize impermanent loss. Our AI monitors price movements and can temporarily exit positions or hedge against adverse market conditions, protecting your capital while maintaining yield generation.",
    },
    {
      icon: Vault,
      question: "What are YLD tokens and how do they work?",
      answer:
        "YLD tokens are fungible receipts you receive when depositing into Yieldera vaults. These tokens represent your share of the vault and can be used in other DeFi protocols while your original assets continue earning yield. This dual utility allows you to maximize capital efficiency by earning yields on both your deposited assets and the YLD tokens themselves.",
    },
    {
      icon: Clock,
      question: "How often does Yieldera rebalance positions?",
      answer:
        "Yieldera's automated system monitors market conditions in real-time and can rebalance positions as frequently as needed. Depending on market volatility and opportunity detection, rebalancing can occur multiple times per day. This ensures you never miss profitable opportunities and your positions are always optimized for current market conditions.",
    },
    {
      icon: Cpu,
      question: "Why is Yieldera built on Hedera instead of Ethereum?",
      answer:
        "Hedera offers significant advantages for DeFi applications: sub-second transaction finality, extremely low fees (fractions of a cent), and high throughput. This means Yieldera can execute frequent rebalancing and optimization strategies cost-effectively, whereas on Ethereum, high gas fees would make such active management unprofitable for smaller positions.",
    },
    // {
    //   icon: Target,
    //   question: "What types of strategies does Yieldera employ?",
    //   answer:
    //     "Yieldera employs multiple strategies including concentrated liquidity management, automated market making optimization, cross-DEX arbitrage opportunities, and intelligent yield farming across various protocols. Our AI selects and combines these strategies based on your risk profile and market conditions to maximize returns.",
    // },
    {
      icon: DollarSign,
      question: "What are the fees for using Yieldera?",
      answer:
        "Yieldera charges a performance fee only on profits generated, aligning our incentives with yours. There are no management fees, deposit fees, or withdrawal fees. You only pay when the platform successfully generates returns for you, making it a win-win relationship where we succeed only when you do.",
    },
    {
      icon: Zap,
      question: "How quickly can I deposit and start earning yields?",
      answer:
        "Thanks to Hedera's fast finality, deposits are confirmed within seconds. Once deposited, our AI immediately begins optimizing your position and you start earning yields right away. There's no waiting period or complex setup - just deposit and let Yieldera do the work for you.",
    },
  ];

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-terminal text-3xl md:text-4xl text-glow-green mb-4">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono">
            Everything you need to know about Yieldera's AI-powered DeFi
            platform
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="neon-border bg-card/50 backdrop-blur-sm rounded-lg px-6 py-2 hover:shadow-neon-green transition-all duration-300"
              >
                <AccordionTrigger className="flex items-center gap-4 hover:no-underline group">
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <faq.icon className="w-6 h-6 text-primary transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    <span className="font-terminal text-sm md:text-base text-foreground">
                      {faq.question}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="ml-10 pr-8">
                    <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground font-mono mb-6">
            Still have questions? Join our community for real-time support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-primary/20 border border-primary text-primary hover:bg-primary/30 transition-colors font-terminal text-sm rounded-lg">
              JOIN DISCORD
            </button>
            <button className="px-8 py-3 bg-secondary/20 border border-secondary text-secondary hover:bg-secondary/30 transition-colors font-terminal text-sm rounded-lg">
              READ DOCS
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
