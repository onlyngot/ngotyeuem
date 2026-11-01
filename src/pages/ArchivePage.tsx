import { useState, useEffect } from 'react';
import { Character } from '@/src/types/character';
import { getCharacters, updateCharacter, deleteCharacter } from '@/src/data/storage';
import ImagePlaceholder from '@/src/components/ui/ImagePlaceholder';
import CharacterProfileModal from '@/src/components/character/CharacterProfileModal';
import EditCharacterModal from '@/src/components/character/EditCharacterModal';
import CustomIcon from '@/src/components/ui/CustomIcon';

export default function ArchivePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    const refresh = () => setCharacters(getCharacters());
    refresh();
    window.addEventListener('caomei_characters_updated', refresh);
    return () => window.removeEventListener('caomei_characters_updated', refresh);
  }, []);

  const handleSaveEdit = (updated: Character) => {
    updateCharacter(updated);
    const refreshed = getCharacters();
    setCharacters(refreshed);
    if (selectedCharacter?.id === updated.id) {
      setSelectedCharacter(updated);
    }
  };

  const handleDelete = (id: string) => {
    deleteCharacter(id);
    const refreshed = getCharacters();
    setCharacters(refreshed);
    if (selectedCharacter?.id === id) {
      setSelectedCharacter(null);
    }
  };

  const handleToggleFavorite = (updated: Character) => {
    updateCharacter(updated);
    setCharacters(getCharacters());
    setSelectedCharacter(updated);
  };

  // Categories list (ensures 'All' is not duplicated if present in data)
  const categories = ['All', ...Array.from(new Set(characters.map(c => c.category || 'General').filter(c => c !== 'All')))];

  // Filtered characters
  const filtered = characters.filter(char => {
    const matchesSearch =
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.fandom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      char.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'All' || char.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-2 sm:p-4 text-[#8d2d48]">
      {/* Detail Profile Modal matching user reference */}
      <CharacterProfileModal
        character={selectedCharacter}
        isOpen={Boolean(selectedCharacter)}
        onClose={() => setSelectedCharacter(null)}
        onEdit={(char) => setEditingCharacter(char)}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Admin Edit Modal */}
      <EditCharacterModal
        character={editingCharacter}
        isOpen={Boolean(editingCharacter)}
        onClose={() => setEditingCharacter(null)}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
      />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#d45d79] tracking-wide">
            Măm măm&gt;&lt;
          </h1>
          <p className="text-xs sm:text-sm text-[#b33959] mt-0.5 font-medium">
            Haiz...anh Tí anh Tèo,anh nào em cũng quý <span className="inline-block whitespace-nowrap">(. ❛ ᴗ ❛.)</span>
          </p>
        </div>

        {/* Search input with CustomIcon */}
        <div className="relative w-full sm:w-80 md:w-96">
          <div
            className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none transition-colors"
            style={{ color: 'var(--theme-primary, #d45d79)' }}
          >
            <CustomIcon name="searchIcon" fallback="🔍" className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Nhập tên,tag,... để tìm người trong mộng,yêu nhé"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-full border-2 bg-[#fffff2] text-xs sm:text-sm shadow-xs transition-colors placeholder:text-[var(--theme-placeholder,rgba(212,93,121,0.65))]"
            style={{
              borderColor: 'var(--theme-border-light, #ffc2d1)',
              color: 'var(--theme-secondary, #8d2d48)',
              outlineColor: 'var(--theme-accent, #ff8fab)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs font-bold transition-colors cursor-pointer"
              style={{ color: 'var(--theme-placeholder, rgba(212, 93, 121, 0.65))' }}
              title="Xóa nội dung tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition border cursor-pointer ${
                filterCategory === cat
                  ? 'bg-[#ff9ebb] text-white border-[#f888a7] shadow-xs'
                  : 'bg-[#fffff2]/90 text-[#8d2d48] border-[#ffc2d1] hover:bg-[#ffdde7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Character Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#fffff2]/80 rounded-3xl border-2 border-dashed border-[#ffb3c6] p-8">
          <div className="flex justify-center mb-2">
            <CustomIcon name="bowIcon" fallback="🎀" className="w-10 h-10" />
          </div>
          <h3 className="font-bold text-[#d45d79] text-base mb-1 leading-snug">
            Ui người iu hổng có ở đây rùi <span className="inline-block whitespace-nowrap">(｡•́︿•̀｡)</span>
          </h3>
          <p className="text-xs text-[#b33959]">em có muốn thử hương vị khác không?</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map(char => (
            <div
              key={char.id}
              onClick={() => setSelectedCharacter(char)}
              className="bg-[#fffff2]/95 rounded-3xl border-2 border-[#ffc2d1] hover:border-[#ff9ebb] p-4 shadow-sm hover:shadow-md transition transform hover:-translate-y-1 cursor-pointer flex flex-col items-center group relative overflow-hidden"
            >
              {/* Avatar frame */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-[3px] border-[#ffb3c6] p-1 bg-[#ffdde7]/40 mb-3 overflow-hidden flex items-center justify-center group-hover:border-[#ff8fab] transition">
                {(char.avatarUrl || char.mainImageUrl) ? (
                  <img
                    src={(char.avatarUrl || char.mainImageUrl) as string}
                    alt={char.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <ImagePlaceholder size="sm" />
                )}
              </div>

              {/* Character Info */}
              <h3 className="font-extrabold text-[#8d2d48] text-base group-hover:text-[#d45d79] transition truncate max-w-full text-center">
                {char.name}
              </h3>

              <p className="text-xs text-[#b33959] font-semibold truncate max-w-full text-center mt-0.5">
                {char.fandom || 'Original'}
              </p>

              {/* Tag previews with ⌗ icon */}
              {char.tags && char.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-2.5 max-h-12 overflow-hidden">
                  {char.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={`${char.id}_tag_${i}_${tag}`}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#ffdde7] text-[#8d2d48] border border-[#ffc2d1] font-bold"
                    >
                      ⌗ {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Card Footer: Clean Xem Profile */}
              <div className="mt-4 w-full pt-3 border-t border-[#ffdde7] flex items-center justify-center text-xs font-bold">
                <span className="text-[#d45d79] group-hover:text-[#b33959] flex items-center gap-1">
                  <span>Xem Profile</span>
                  <span className="transform group-hover:translate-x-1 transition">➔</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
