import React, { useEffect, useState } from 'react';
import { tokenManager } from '../services/authMiddleware';

export default function DocumentViewer({ url, onClose }) {
  const [documentContent, setDocumentContent] = useState(null);
  const [documentContentLoading, setDocumentContentLoading] = useState(false);
  const [documentContentError, setDocumentContentError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Note: fetching/loading is deferred until `loaded` is set true by user action
  useEffect(() => {
    if (!url || !loaded) return;

    const getExt = (u) => {
      try {
        const parsed = new URL(u, window.location.origin);
        const parts = parsed.pathname.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
      } catch {
        const parts = u.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
      }
    };

    const ext = getExt(url);
    const textExts = ['txt', 'md', 'csv', 'log', 'json'];
    if (!textExts.includes(ext)) {
      setDocumentContent(null);
      return;
    }

    const fetchText = async () => {
      setDocumentContentLoading(true);
      setDocumentContentError(null);
      try {
        const headers = {};
        const token = tokenManager.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const absoluteUrl = url.startsWith('http') ? url : window.location.origin + url;
        const resp = await fetch(absoluteUrl, { headers });
        if (!resp.ok) throw new Error(`Failed to load document (${resp.status})`);
        const text = await resp.text();
        setDocumentContent(text);
      } catch (err) {
        setDocumentContentError(err.message || String(err));
      } finally {
        setDocumentContentLoading(false);
      }
    };

    fetchText();
  }, [url, loaded]);

  if (!url) return null;

  const getExt = (u) => {
    try {
      const parsed = new URL(u, window.location.origin);
      const parts = parsed.pathname.split('.');
      return parts.length > 1 ? parts.pop().toLowerCase() : '';
    } catch {
      const parts = u.split('.');
      return parts.length > 1 ? parts.pop().toLowerCase() : '';
    }
  };

  const ext = getExt(url);
  const imageExts = ['png','jpg','jpeg','gif','bmp','webp','svg'];
  const videoExts = ['mp4','webm','ogg','mov'];
  const audioExts = ['mp3','wav','ogg'];
  const pdfExts = ['pdf'];
  const officeExts = ['doc','docx','ppt','pptx','xls','xlsx'];
  const textExts = ['txt','md','csv','json','log'];

  const absoluteUrl = url && url.startsWith('http') ? url : (url ? window.location.origin + url : '');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '95%',
        maxHeight: '95%',
        width: '1000px',
        height: '800px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#1a202c' }}>Document Viewer</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#4a5568' }}>×</button>
        </div>

        <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'stretch' }}>
          {pdfExts.includes(ext) && (
            loaded ? <iframe src={absoluteUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Viewer" /> : <div style={{ padding: 20 }}>Click "Load Document" to view.</div>
          )}

          {imageExts.includes(ext) && (
            loaded ? <img src={absoluteUrl} alt="Document" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ padding: 20 }}>Click "Load Document" to view.</div>
          )}

          {videoExts.includes(ext) && (
            loaded ? <video controls src={absoluteUrl} style={{ width: '100%', height: '100%', background: '#000' }} /> : <div style={{ padding: 20 }}>Click "Load Document" to view.</div>
          )}

          {audioExts.includes(ext) && (
            loaded ? (
              <div style={{ padding: 20, width: '100%' }}>
                <audio controls src={absoluteUrl} style={{ width: '100%' }} />
              </div>
            ) : <div style={{ padding: 20 }}>Click "Load Document" to play audio.</div>
          )}

          {officeExts.includes(ext) && (
            loaded ? <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl)}`} style={{ width: '100%', height: '100%', border: 'none' }} title="Office Viewer" /> : <div style={{ padding: 20 }}>Click "Load Document" to view Office file.</div>
          )}

          {textExts.includes(ext) && (
            !loaded ? (
              <div style={{ padding: 20 }}>Click "Load Document" to fetch and view.</div>
            ) : (documentContentLoading ? (
              <div style={{ padding: 20 }}>Loading document...</div>
            ) : documentContentError ? (
              <div style={{ padding: 20, color: 'red' }}>Error loading document: {documentContentError}</div>
            ) : (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: 16, margin: 0, overflow: 'auto', width: '100%' }}>{documentContent}</pre>
            ))
          )}

          {/* Fallback */}
          {(!pdfExts.includes(ext) && !imageExts.includes(ext) && !videoExts.includes(ext) && !audioExts.includes(ext) && !officeExts.includes(ext) && !textExts.includes(ext)) && (
            loaded ? <iframe src={absoluteUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Viewer" /> : <div style={{ padding: 20 }}>Click "Load Document" to view.</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <div>
            {!loaded ? (
              <button onClick={() => setLoaded(true)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #3182ce', background: '#3182ce', color: '#fff' }}>Load Document</button>
            ) : (
              <span style={{ color: '#2d3748' }}>Document loaded</span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <a href={loaded ? absoluteUrl : '#'} onClick={(e)=>{ if(!loaded) e.preventDefault(); }} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button disabled={!loaded} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: loaded ? '#fff' : '#f7fafc', cursor: loaded ? 'pointer' : 'not-allowed' }}>Open in new tab</button>
            </a>
            <a href={loaded ? absoluteUrl : '#'} onClick={(e)=>{ if(!loaded) e.preventDefault(); }} download style={{ textDecoration: 'none' }}>
              <button disabled={!loaded} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: loaded ? '#fff' : '#f7fafc', cursor: loaded ? 'pointer' : 'not-allowed' }}>Download</button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
