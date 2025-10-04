export default function PublicHomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="container text-center py-28 md:py-36">
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-4">Meet Your<br />AI Paralegal Assistants</h1>
        <p className="text-lg md:text-xl text-[var(--color-neutral-mid)] mb-8">Add clients. Assign an AI agent. Watch the work get done.</p>
        <div className="flex items-center justify-center gap-4">
          <a className="btn-black prominent" href="#">Start Free Trial</a>
          <a className="btn-outline prominent" href="#">Talk to an Expert</a>
        </div>
      </section>
    </div>
  );
}

