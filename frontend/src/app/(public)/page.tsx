import { Button } from '@/components/ui/button';

export default function PublicHomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="text-center py-20 md:py-28 lg:py-36">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4">
          Meet Your<br />AI Paralegal Assistants
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Add clients. Assign an AI agent. Watch the work get done.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild>
            <a href="#">Start Free Trial</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#">Talk to an Expert</a>
          </Button>
        </div>
      </section>
    </div>
  );
}

