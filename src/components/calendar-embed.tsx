export function CalendarEmbed({ url }: { url: string }) {
  return (
    <div className="rounded-md overflow-hidden border border-subtle">
      <iframe
        src={url}
        style={{ border: 0 }}
        width="100%"
        height="450"
        loading="lazy"
        title="Google Calendar"
      />
    </div>
  );
}
