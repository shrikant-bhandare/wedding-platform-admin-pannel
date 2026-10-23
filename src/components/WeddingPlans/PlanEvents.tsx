import React from 'react';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';

export interface PlanEventItem {
  eventType: string;
  eventDate: string;
  startTime?: string;
  guestCount: number;
  venueName?: string;
  venuePrice?: number;
  venueUndecided?: boolean;
  services?: Array<{ serviceName: string; price: number; quantity?: number }>;
  addons?: Array<{ addonName: string; price: number; quantity: number }>;
  timelineItems?: Array<{ time: string; event: string }>;
}

const LABELS: Record<string, string> = {
  wedding: 'Wedding Ceremony', reception: 'Reception', engagement: 'Engagement', sangeet: 'Sangeet Night', mehndi: 'Mehndi Ceremony',
  haldi: 'Haldi Ceremony', roka: 'Roka Ceremony', cocktail: 'Cocktail Party', prewedding: 'Pre-Wedding Shoot', bachelor: 'Bachelor / Bachelorette',
};

const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const time12 = (hhmm?: string) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** The events of a multi-event plan, each with its venue, items, schedule and subtotal. */
const PlanEvents: React.FC<{ events: PlanEventItem[] }> = ({ events }) => (
  <div className="space-y-3">
    <h4 className="font-medium text-gray-900">Events ({events.length})</h4>
    {events.map((e, i) => {
      const lines = [
        ...(e.services || []).map((s) => ({ name: s.serviceName, qty: s.quantity || 1, amount: s.price * (s.quantity || 1) })),
        ...(e.addons || []).map((a) => ({ name: a.addonName, qty: a.quantity || 1, amount: a.price * (a.quantity || 1) })),
      ];
      const subtotal = (e.venuePrice || 0) + lines.reduce((s, l) => s + l.amount, 0);
      return (
        <div key={i} className="rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold text-gray-900">{LABELS[e.eventType] || e.eventType}</p>
            <p className="text-sm font-semibold text-gray-900 tabular-nums">{inr(subtotal)}</p>
          </div>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(e.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {e.startTime && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{time12(e.startTime)}</span>}
            <span className="flex items-center gap-1"><Users className="w-4 h-4" />{e.guestCount} guests</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {e.venueName ? `${e.venueName}${e.venuePrice ? ` (${inr(e.venuePrice)})` : ''}` : e.venueUndecided ? 'Coordinator to suggest a venue' : 'No venue'}
            </span>
          </p>
          {lines.length > 0 && (
            <ul className="mt-3 divide-y divide-gray-100 text-sm">
              {lines.map((l, j) => (
                <li key={j} className="flex justify-between py-1.5">
                  <span className="text-gray-700">{l.name}{l.qty > 1 ? ` × ${l.qty}` : ''}</span>
                  <span className="tabular-nums text-gray-900">{inr(l.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          {!!e.timelineItems?.length && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900">Schedule ({e.timelineItems.length})</summary>
              <ol className="mt-2 space-y-1">
                {e.timelineItems.map((t, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="w-20 shrink-0 font-medium text-gray-500 tabular-nums">{t.time}</span>
                    <span className="text-gray-800">{t.event}</span>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      );
    })}
  </div>
);

export default PlanEvents;
