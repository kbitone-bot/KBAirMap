import React, { useState, useEffect } from 'react';
import { Download, Trash2, Check, AlertCircle, Map } from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

interface OfflineMapManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MapRegion {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  minZoom: number;
  maxZoom: number;
  size: string;
  downloaded: boolean;
}

const DEFAULT_REGIONS: MapRegion[] = [
  {
    id: 'korea-central',
    name: '한국 중부 (수도권)',
    bounds: { north: 38, south: 36, east: 128, west: 126 },
    minZoom: 5,
    maxZoom: 12,
    size: '~150MB',
    downloaded: false,
  },
  {
    id: 'korea-south',
    name: '한국 남부',
    bounds: { north: 36, south: 33, east: 130, west: 125 },
    minZoom: 5,
    maxZoom: 12,
    size: '~180MB',
    downloaded: false,
  },
  {
    id: 'korea-north',
    name: '한국 북부',
    bounds: { north: 39, south: 37, east: 130, west: 124 },
    minZoom: 5,
    maxZoom: 12,
    size: '~120MB',
    downloaded: false,
  },
];

export const OfflineMapManager: React.FC<OfflineMapManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [regions, setRegions] = useState<MapRegion[]>(DEFAULT_REGIONS);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDownloadedRegions();
    checkStorage();
  }, []);

  const checkStorage = async () => {
    try {
      await Filesystem.stat({
        path: '.',
        directory: Directory.Data,
      });
      // This is a simplified check - actual implementation would calculate directory size
      setStorageInfo({ used: 0, total: 1024 * 1024 * 1024 }); // 1GB placeholder
    } catch (e) {
      console.warn('Storage check failed:', e);
    }
  };

  const loadDownloadedRegions = async () => {
    try {
      // Check which regions are already downloaded
      const updatedRegions = await Promise.all(
        regions.map(async (region) => {
          try {
            await Filesystem.readdir({
              path: `maps/${region.id}`,
              directory: Directory.Data,
            });
            return { ...region, downloaded: true };
          } catch {
            return region;
          }
        })
      );
      setRegions(updatedRegions);
    } catch (e) {
      console.error('Failed to load downloaded regions:', e);
    }
  };

  const downloadRegion = async (region: MapRegion) => {
    setDownloading(region.id);
    setError(null);

    try {
      // Create directory for the region
      await Filesystem.mkdir({
        path: `maps/${region.id}`,
        directory: Directory.Data,
        recursive: true,
      });

      // In a real implementation, this would download actual map tiles
      // For now, we'll create a placeholder file
      await Filesystem.writeFile({
        path: `maps/${region.id}/manifest.json`,
        data: JSON.stringify({
          ...region,
          downloadedAt: new Date().toISOString(),
        }),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      // Simulate download progress
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setRegions((prev) =>
        prev.map((r) => (r.id === region.id ? { ...r, downloaded: true } : r))
      );
    } catch (e) {
      setError(`다운로드 실패: ${e}`);
    } finally {
      setDownloading(null);
    }
  };

  const deleteRegion = async (region: MapRegion) => {
    try {
      await Filesystem.rmdir({
        path: `maps/${region.id}`,
        directory: Directory.Data,
        recursive: true,
      });

      setRegions((prev) =>
        prev.map((r) => (r.id === region.id ? { ...r, downloaded: false } : r))
      );
    } catch (e) {
      setError(`삭제 실패: ${e}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Map size={20} />
            오프라인 지도 관리
          </h2>
          <button className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="storage-info">
            <div className="storage-bar">
              <div
                className="storage-used"
                style={{ width: `${(storageInfo.used / storageInfo.total) * 100}%` }}
              />
            </div>
            <span className="storage-text">
              {Math.round(storageInfo.used / 1024 / 1024)}MB /{' '}
              {Math.round(storageInfo.total / 1024 / 1024)}MB 사용 중
            </span>
          </div>

          <div className="regions-list">
            {regions.map((region) => (
              <div key={region.id} className="region-item">
                <div className="region-info">
                  <h3>{region.name}</h3>
                  <p>
                    줌 레벨: {region.minZoom}-{region.maxZoom} | 예상 크기:{' '}
                    {region.size}
                  </p>
                </div>
                <div className="region-actions">
                  {region.downloaded ? (
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => deleteRegion(region)}
                      title="삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => downloadRegion(region)}
                      disabled={downloading === region.id}
                    >
                      {downloading === region.id ? (
                        <>
                          <div className="spinner-sm" />
                          다운로드 중...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          다운로드
                        </>
                      )}
                    </button>
                  )}
                  {region.downloaded && (
                    <span className="downloaded-badge">
                      <Check size={14} />
                      저장됨
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="modal-note">
            <AlertCircle size={14} />
            <p>
              오프라인 지도는 Wi-Fi 연결 시 다운로드하는 것을 권장합니다.
              실제 항공용 지도 데이터는 별도의 데이터 소스에서 가져와야 합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineMapManager;
