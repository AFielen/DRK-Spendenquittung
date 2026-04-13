'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/components/AuthProvider';
import ZuwendungTabelle from '@/components/ZuwendungTabelle';
import ZuwendungFormular from '@/components/ZuwendungFormular';
import ZuwendungDetails from '@/components/ZuwendungDetails';
import type { Zuwendung, Spender, Verein } from '@/lib/types';
import { spenderAnzeigename } from '@/lib/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import { downloadBlob } from '@/lib/download';

function ZuwendungenContent() {
  const { kreisverband } = useAuth();
  const [spenderList, setSpenderList] = useState<Spender[]>([]);
  const [zuwendungen, setZuwendungen] = useState<Zuwendung[]>([]);
  const [showFormular, setShowFormular] = useState(false);
  const [editZuwendung, setEditZuwendung] = useState<Zuwendung | undefined>();
  const [detailsZuwendung, setDetailsZuwendung] = useState<Zuwendung | undefined>();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingSpenderPdf, setDownloadingSpenderPdf] = useState(false);

  const reload = useCallback(async () => {
    const [sp, zw] = await Promise.all([
      apiGet<Spender[]>('/api/spender'),
      apiGet<Zuwendung[]>('/api/zuwendungen'),
    ]);
    setSpenderList(sp);
    setZuwendungen(zw.map((z) => ({ ...z, betrag: Number(z.betrag) })));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleSave(zuwendung: Zuwendung) {
    if (editZuwendung) {
      await apiPut(`/api/zuwendungen/${editZuwendung.id}`, zuwendung);
    } else {
      await apiPost('/api/zuwendungen', zuwendung);
    }
    setShowFormular(false);
    setEditZuwendung(undefined);
    await reload();
  }

  function handleEdit(zuwendung: Zuwendung) {
    setEditZuwendung(zuwendung);
    setShowFormular(true);
  }

  async function handleDelete(zuwendung: Zuwendung) {
    await apiDelete(`/api/zuwendungen/${zuwendung.id}`);
    await reload();
  }

  function handleShowDetails(zuwendung: Zuwendung) {
    setDetailsZuwendung(zuwendung);
  }

  async function downloadPdfForZuwendung(doppel: boolean) {
    if (!detailsZuwendung || !kreisverband) return;
    const spender = spenderList.find((s) => s.id === detailsZuwendung.spenderId);
    if (!spender) return;

    const setLoading = doppel ? setDownloadingPdf : setDownloadingSpenderPdf;
    setLoading(true);
    try {
      const typ = detailsZuwendung.bestaetigungTyp === 'anlage4' ? 'sachzuwendung'
        : detailsZuwendung.bestaetigungTyp === 'anlage14' ? 'sammelbestaetigung'
        : detailsZuwendung.bestaetigungTyp === 'vereinfacht' ? 'vereinfacht'
        : 'geldzuwendung';

      const body: Record<string, unknown> = {
        typ,
        spenderId: spender.id,
        zuwendungIds: [detailsZuwendung.id],
        laufendeNr: detailsZuwendung.laufendeNr ?? '',
        doppel,
      };

      if (typ === 'sammelbestaetigung') {
        const jahr = detailsZuwendung.datum.substring(0, 4);
        body.zeitraum = { von: `${jahr}-01-01`, bis: `${jahr}-12-31` };
        body.zuwendungIds = zuwendungen
          .filter((z) => z.spenderId === spender.id && z.art === 'geld' && z.datum.startsWith(jahr))
          .map((z) => z.id);
      }

      const res = await fetch('/api/dokumente/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('PDF-Generierung fehlgeschlagen');

      const blob = await res.blob();
      const dateiName = spenderAnzeigename(spender).replace(/\s+/g, '_');
      const suffix = doppel ? 'Doppel' : 'Bestaetigung';
      downloadBlob(blob, `${dateiName}_${suffix}.pdf`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler beim PDF-Download');
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPdf() {
    downloadPdfForZuwendung(true);
  }

  function handleDownloadSpenderPdf() {
    downloadPdfForZuwendung(false);
  }

  return (
    <div className="py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="drk-card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 data-tour="zuwendung-titel" className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Zuwendungen
            </h2>
            <button
              data-tour="btn-neue-zuwendung"
              className="drk-btn-primary text-sm"
              onClick={() => {
                setEditZuwendung(undefined);
                setShowFormular(true);
              }}
            >
              + Neue Zuwendung
            </button>
          </div>

          <div data-tour="zuwendung-tabelle">
            <ZuwendungTabelle
              zuwendungen={zuwendungen}
              spenderList={spenderList}
              verein={kreisverband ? { ...kreisverband, freistellungsart: kreisverband.freistellungsart as Verein['freistellungsart'] } : undefined}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShowDetails={handleShowDetails}
            />
          </div>
        </div>
      </div>

      {showFormular && (
        <ZuwendungFormular
          spenderList={spenderList}
          zuwendung={editZuwendung}
          onSave={handleSave}
          onCancel={() => {
            setShowFormular(false);
            setEditZuwendung(undefined);
          }}
        />
      )}

      {detailsZuwendung && (
        <ZuwendungDetails
          zuwendung={detailsZuwendung}
          spender={spenderList.find((s) => s.id === detailsZuwendung.spenderId)}
          onClose={() => setDetailsZuwendung(undefined)}
          onDownloadPdf={handleDownloadPdf}
          onDownloadSpenderPdf={handleDownloadSpenderPdf}
          downloadingPdf={downloadingPdf}
          downloadingSpenderPdf={downloadingSpenderPdf}
        />
      )}
    </div>
  );
}

export default function ZuwendungenPage() {
  return (
    <AuthGuard>
      <ZuwendungenContent />
    </AuthGuard>
  );
}
