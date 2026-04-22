import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/calendar/export?format=csv|ics
 *
 * Exports every scheduled campaign for the current user as either CSV or an
 * iCalendar (.ics) file. ICS drops straight into Google Calendar, Apple
 * Calendar, Outlook via their "Import from URL" flows.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = (url.searchParams.get("format") ?? "csv").toLowerCase();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("id, title, prompt, content_type, scheduled_date, completed, brand_kit_applied, created_at")
      .eq("user_id", user.id)
      .not("scheduled_date", "is", null)
      .order("scheduled_date", { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rows = campaigns ?? [];

    if (format === "ics") {
      // Build an iCalendar feed. Each scheduled item is a 30-minute all-day-adjacent event.
      const lines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//VibeFlow Marketing//Calendar Export//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:VibeFlow Scheduled Campaigns",
      ];

      for (const c of rows) {
        if (!c.scheduled_date) continue;
        const start = new Date(c.scheduled_date);
        const end = new Date(start.getTime() + 30 * 60 * 1000); // +30 min
        const fmtIcs = (d: Date) =>
          d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
        const title = (c.title ?? c.content_type ?? "Campaign").replace(/\n/g, " ").slice(0, 200);
        const desc = (c.prompt ?? "").replace(/\n/g, "\\n").slice(0, 800);
        lines.push(
          "BEGIN:VEVENT",
          `UID:${c.id}@vibeflow.marketing`,
          `DTSTAMP:${fmtIcs(new Date())}`,
          `DTSTART:${fmtIcs(start)}`,
          `DTEND:${fmtIcs(end)}`,
          `SUMMARY:${title}`,
          `DESCRIPTION:${desc}`,
          `STATUS:${c.completed ? "COMPLETED" : "CONFIRMED"}`,
          `CATEGORIES:${c.content_type}`,
          `URL:https://vibeflow.marketing/dashboard/campaigns/${c.id}/results`,
          "END:VEVENT",
        );
      }

      lines.push("END:VCALENDAR");

      return new Response(lines.join("\r\n"), {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="vibeflow-calendar-${Date.now()}.ics"`,
        },
      });
    }

    // Default: CSV
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      "id", "title", "content_type", "scheduled_date",
      "completed", "brand_kit_applied", "created_at", "prompt",
    ];
    const csvLines = [
      header.join(","),
      ...rows.map(r => [
        r.id,
        r.title ?? "",
        r.content_type,
        r.scheduled_date ?? "",
        r.completed ? "true" : "false",
        r.brand_kit_applied ? "true" : "false",
        r.created_at,
        r.prompt,
      ].map(escape).join(",")),
    ];

    return new Response(csvLines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vibeflow-calendar-${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Export failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
