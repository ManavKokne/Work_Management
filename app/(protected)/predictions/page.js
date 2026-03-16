import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PredictionsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <Card>
        <CardHeader>
          <CardTitle>Predictions</CardTitle>
          <CardDescription>Placeholder page for predictive analytics.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            This is a dummy Predictions page. Forecasting modules and charts can be plugged in here.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
