import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import '../styles/AirspaceFilter.css';

export interface AirspaceFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    fullName: string;
    type: string;
    category: string;
    upper: string;
    lower: string;
    color: string;
    schedule?: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface AirspaceFilterProps {
  onVisibilityChange: (visibleIds: Set<string>) => void;
}

interface CategoryGroup {
  name: string;
  types: string[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  { name: '방공식별구역', types: ['adiz'] },
  { name: '비행정보구역', types: ['fir'] },
  { name: '관제구역', types: ['tma', 'cta'] },
  { name: '금지구역', types: ['prohibited'] },
  { name: '제한구역', types: ['restricted'] },
  { name: '위험구역', types: ['danger'] },
];

export function AirspaceFilter({ onVisibilityChange }: AirspaceFilterProps) {
  const [airspaces, setAirspaces] = useState<AirspaceFeature[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // 공역 데이터 로드
  useEffect(() => {
    fetch('/data/airspaces.json')
      .then(r => r.json())
      .then(data => {
        setAirspaces(data.features || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 가시성 변경 시 상위 컴포넌트에 알림
  useEffect(() => {
    onVisibilityChange(visibleIds);
  }, [visibleIds, onVisibilityChange]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  const toggleAirspace = (id: string) => {
    setVisibleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCategoryAll = (_categoryName: string, typeIds: string[]) => {
    setVisibleIds(prev => {
      const next = new Set(prev);
      const allVisible = typeIds.every(id => next.has(id));
      
      if (allVisible) {
        // 모두 체크되어 있으면 해제
        typeIds.forEach(id => next.delete(id));
      } else {
        // 하나라도 체크 안되어 있으면 전체 선택
        typeIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // 카테고리별 공역 그룹화
  const grouped = CATEGORY_GROUPS.map(group => ({
    ...group,
    items: airspaces.filter(a => group.types.includes(a.properties.type)),
  })).filter(g => g.items.length > 0);

  if (loading) {
    return (
      <div className="airspace-filter loading">
        <Layers size={16} />
        <span>공역 로딩...</span>
      </div>
    );
  }

  return (
    <div className="airspace-filter">
      <div className="filter-header">
        <Layers size={16} />
        <span>공역 필터</span>
        <span className="count">{visibleIds.size}/{airspaces.length}</span>
      </div>
      
      <div className="filter-tree">
        {grouped.map(group => {
          const groupIds = group.items.map(i => i.properties.id);
          const checkedCount = groupIds.filter(id => visibleIds.has(id)).length;
          const isExpanded = expandedCategories.has(group.name);
          const isIndeterminate = checkedCount > 0 && checkedCount < groupIds.length;
          const isAllChecked = checkedCount === groupIds.length && checkedCount > 0;

          return (
            <div key={group.name} className="filter-group">
              <div 
                className="group-header"
                onClick={() => toggleCategory(group.name)}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <label 
                  className="checkbox-label"
                  onClick={e => {
                    e.stopPropagation();
                    toggleCategoryAll(group.name, groupIds);
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={isAllChecked}
                    ref={el => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={() => {}}
                  />
                  <span className="group-name">{group.name}</span>
                  <span className="group-count">({checkedCount}/{group.items.length})</span>
                </label>
              </div>
              
              {isExpanded && (
                <div className="group-items">
                  {group.items.map(item => (
                    <label key={item.properties.id} className="item-label">
                      <input
                        type="checkbox"
                        checked={visibleIds.has(item.properties.id)}
                        onChange={() => toggleAirspace(item.properties.id)}
                      />
                      <span 
                        className="color-dot" 
                        style={{ backgroundColor: item.properties.color }}
                      />
                      <span className="item-name">{item.properties.name}</span>
                      <span className="item-alt">{item.properties.lower}-{item.properties.upper}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AirspaceFilter;
