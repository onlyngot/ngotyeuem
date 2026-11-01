import { useNavigate, Link } from 'react-router-dom';
import { Character } from '@/src/types/character';
import { getCharacters, saveCharacters } from '@/src/data/storage';
import { isAdminUser } from '@/src/data/authRoleStorage';
import AddCharacterForm from '@/src/components/forms/AddCharacterForm';

function generateSafeId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fallback below
  }
  return 'char_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

export default function AddCharacterPage() {
  const navigate = useNavigate();
  const isAdmin = isAdminUser();

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto text-center flex flex-col items-center justify-center gap-4 bg-[#fffff2] border-2 border-[#ffb3c6] rounded-3xl shadow-sm">
        <span className="text-4xl animate-bounce">꒰(｡•́︿•̀｡)꒱</span>
        <h2 className="text-lg font-black text-[#8d2d48]">Khu Vực Riêng Tư</h2>
        <p className="text-xs text-[#b33959] leading-relaxed">
          Mục thêm nhân vật chỉ dành cho <strong>chủ khu tự trị (admin)</strong> thui nè! Người xem không thể thêm hoặc chỉnh sửa dữ liệu nhé.
        </p>
        <Link
          to="/archive"
          className="px-5 py-2 rounded-full bg-gradient-to-r from-[#ffe0df] to-[#ffdde7] hover:from-[#ffc2d1] hover:to-[#ffaac4] text-[#8d2d48] font-bold text-xs border border-[#ffb3c6] transition shadow-xs"
        >
          ♡ Quay lại danh sách người trong lòng ♡
        </Link>
      </div>
    );
  }

  const handleAddCharacter = (newCharacterData: Omit<Character, 'id' | 'createdAt'>) => {
    try {
      const characters = getCharacters();
      const newCharacter: Character = {
        ...newCharacterData,
        id: generateSafeId(),
        createdAt: Date.now(),
      };
      saveCharacters([...characters, newCharacter]);
      navigate('/archive');
    } catch (err) {
      console.error('Error adding character:', err);
      navigate('/archive');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <AddCharacterForm onAdd={handleAddCharacter} />
    </div>
  );
}

