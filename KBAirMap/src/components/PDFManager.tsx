import { useState } from 'react';
import { X, FileText, Lock } from 'lucide-react';
import '../styles/PDFManager.css';

interface Props {
  onClose: () => void;
}

const BASES = [
  { id: 'k16', code: 'K-16', name: '서울공항' },
  { id: 'k55', code: 'K-55', name: '오산기지' },
  { id: 'k2', code: 'K-2', name: '대구기지' },
  { id: 'k8', code: 'K-8', name: '군산기지' },
  { id: 'k9', code: 'K-9', name: '광주기지' },
];

const DOCS = [
  { name: 'ILS OR LOC', cat: '접근' },
  { name: 'SID', cat: '출발' },
  { name: '공항도', cat: '공항' },
  { name: '비상절차', cat: '비상' },
];

export function PDFManager({ onClose }: Props) {
  const [sel, setSel] = useState(BASES[0].id);

  return (
    <div className="pdf-modal" onClick={onClose}>
      <div className="pdf-content" onClick={e => e.stopPropagation()}>
        <div className="pdf-hd">
          <h3><FileText size={16} /> 비행 자료</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        
        <div className="pdf-sec">
          <Lock size={12} />
          <span>군사기밀 취급</span>
        </div>

        <div className="pdf-body">
          <div className="pdf-bases">
            {BASES.map(b => (
              <button key={b.id} className={sel === b.id ? 'active' : ''} onClick={() => setSel(b.id)}>
                <span className="code">{b.code}</span>
                <span className="name">{b.name}</span>
              </button>
            ))}
          </div>
          <div className="pdf-docs">
            {DOCS.map((d, i) => (
              <div key={i} className="doc-row">
                <span className="cat">{d.cat}</span>
                <span className="name">{d.name}</span>
                <button>보기</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFManager;
