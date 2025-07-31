const TechStack = () => {
  return (
    <section className="py-12 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h4 className="font-terminal text-lg text-muted-foreground mb-8">
            TECH STACK
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-80">
            <div className="font-mono text-sm text-primary">
              HEDERA AGENT KIT
            </div>
            <div className="font-mono text-sm text-secondary">
              HTS - HEDERA TOKEN SERVICE
            </div>
            <div className="font-mono text-sm text-accent">
              SMART CONTRACT SERVICE
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechStack;
