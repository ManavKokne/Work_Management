import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SummaryPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Placeholder page for summary insights.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            This is a dummy Summary page. Detailed reporting widgets will be added here.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
