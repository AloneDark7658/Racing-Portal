import { useState, useEffect, useCallback } from 'react';

/**
 * useFormDraft — Form taslak verilerini localStorage'a otomatik kaydeder (FAZ 2)
 * 
 * @param {string} key - localStorage anahtarı (örn: 'leave-request-draft')
 * @param {object} initialState - Formun başlangıç değeri
 * @returns {[object, function, function]} [formData, setFormData, clearDraft]
 * 
 * Kullanım:
 *   const [form, setForm, clearDraft] = useFormDraft('leave-draft', { date: '', reason: '' });
 *   // Form başarıyla gönderildiğinde clearDraft() çağır
 */
const useFormDraft = (key, initialState) => {
  const storageKey = `draft_${key}`;

  // İlk yükleme: localStorage'da kaydedilmiş taslak var mı bak
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge: initialState'deki yeni field'lar eksik kalmayasın
        return { ...initialState, ...parsed };
      }
    } catch {
      // JSON parse hatası olursa default'a dön
    }
    return initialState;
  });

  // Form her değiştiğinde localStorage'a kaydet (debounce olmadan, anlık)
  useEffect(() => {
    try {
      // Eğer form tamamen boşsa (initial state ile aynıysa) kaydetmeye gerek yok
      const isEmpty = Object.values(formData).every(v => 
        v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0)
      );
      if (isEmpty) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      }
    } catch {
      // localStorage dolu veya erişilemez, sessizce geç
    }
  }, [formData, storageKey]);

  // Form başarıyla gönderilince taslağı sil
  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setFormData(initialState);
  }, [storageKey, initialState]);

  return [formData, setFormData, clearDraft];
};

export default useFormDraft;
