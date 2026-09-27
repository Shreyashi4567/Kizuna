import React from 'react';
import { AccidentEvent, AccidentRelevance } from '@/types';
import { Newspaper, ExternalLink, Calendar, AlertOctagon, CheckCircle, Navigation, Users } from 'lucide-react';

interface AccidentIntelligenceCardProps {
  events: AccidentEvent[];
  summary: string;
  totalFound: number;
  highRelevanceCount: number;
}

export const AccidentIntelligenceCard: React.FC<AccidentIntelligenceCardProps> = ({
  events,
  summary,
  totalFound,
  highRelevanceCount,
}) => {
  const getRelevanceBadge = (rel: AccidentRelevance) => {
    switch (rel) {
      case 'HIGH':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            HIGH CORRIDOR MATCH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            NEARBY INTERSECTION
          </span>
        );
      case 'LOW':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            REGIONAL CONTEXT
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            NOT RELEVANT
          </span>
        );
    }
  };

  const getSeverityBadge = (sev: AccidentEvent['severity']) => {
    if (sev === 'fatal') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
          <AlertOctagon className="w-3 h-3 text-rose-600" /> Fatal Collision
        </span>
      );
    }
    if (sev === 'serious') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
          <AlertOctagon className="w-3 h-3 text-amber-600" /> Serious Incident
        </span>
      );
    }
    return (
      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 capitalize">
        {sev} incident
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
              Recent Road Incidents — 100 KM Radius Intelligence
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregates publicly indexed accident reports within a strict 100 km Haversine perimeter. Uses Groq AI to extract casualty &amp; corridor evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {highRelevanceCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-semibold">
              {highRelevanceCount} Corridor Match{highRelevanceCount > 1 ? 'es' : ''}
            </span>
          )}
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
            {events.length} within 100km / {totalFound} total indexed
          </span>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>{summary}</span>
      </div>

      {/* Events List */}
      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <p className="text-xs text-slate-500 italic">
              No public accident incident records cataloged within the 100 km radius of this road location.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Zero synthetic articles are generated. Incident history remains unverified until official news archives index collisions for this coordinate perimeter.
            </p>
          </div>
        ) : (
          events.map((ev, i) => (
            <div
              key={ev.id || i}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {getRelevanceBadge(ev.relevance)}
                  {getSeverityBadge(ev.severity)}

                  {ev.distanceKm !== undefined && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                      <Navigation className="w-2.5 h-2.5 text-blue-600" />
                      {ev.distanceKm} km away
                    </span>
                  )}

                  {Boolean(ev.casualties && ev.casualties > 0) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                      <Users className="w-2.5 h-2.5 text-rose-600" />
                      {ev.casualties} casualty reported
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {ev.date ? `Date: ${ev.date}` : 'Date: Recent archive'}
                  </span>
                  <span>|</span>
                  <span className="font-sans font-medium text-slate-700 dark:text-slate-300">
                    {ev.source}
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-2">
                {ev.title}
              </h4>

              {ev.snippet && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {ev.snippet}
                </p>
              )}

              {ev.relevanceReason && (
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded flex items-center justify-between">
                  <span>Corridor Match: {ev.relevanceReason}</span>
                  {ev.url && ev.url !== '#' && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Article <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
