import React, { useState } from 'react';
import { 
  Instagram, 
  Heart, 
  Flame, 
  MessageCircle, 
  Share2, 
  Camera, 
  X, 
  Check, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SocialPost } from '../types';
import { SOCIAL_POSTS } from '../data/socialData';

export const SocialFeedSection: React.FC = () => {
  const [posts, setPosts] = useState<SocialPost[]>(SOCIAL_POSTS);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // New photo upload state
  const [authorName, setAuthorName] = useState('');
  const [caption, setCaption] = useState('');
  const [previewImage, setPreviewImage] = useState<string>('https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80');

  const handleToggleLike = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setLikedPosts(prev => {
      const isAlreadyLiked = !!prev[postId];
      const nextLiked = !isAlreadyLiked;

      setPosts(currentPosts =>
        currentPosts.map(p => {
          if (p.id === postId) {
            return { ...p, likes: isAlreadyLiked ? p.likes - 1 : p.likes + 1 };
          }
          return p;
        })
      );

      if (nextLiked) {
        confetti({
          particleCount: 25,
          spread: 40,
          origin: { y: 0.8 }
        });
      }

      return { ...prev, [postId]: nextLiked };
    });
  };

  const handleAddCommunityPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) return;

    const newPost: SocialPost = {
      id: `post-user-${Date.now()}`,
      imageUrl: previewImage,
      caption: caption || 'Adorei a experiência na Deolinda Pizzaria! Que massa incrível! 🍕✨ #DeolindaNapoletana',
      author: authorName.startsWith('@') ? authorName : `@${authorName.toLowerCase().replace(/\s+/g, '')}`,
      likes: 1,
      timestamp: 'Agora mesmo',
      isHotOutOfOven: true,
      tags: ['#DeolindaNapoletana', '#PizzaLovers']
    };

    setPosts([newPost, ...posts]);
    setLikedPosts(prev => ({ ...prev, [newPost.id]: true }));
    setIsUploadModalOpen(false);
    setAuthorName('');
    setCaption('');

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.5 }
    });
  };

  return (
    <section id="galeria" className="py-12 sm:py-16 bg-[#F4EFE6] text-[#1E1B18] border-b border-[#EADFCF] scroll-mt-20">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C24D2C]/10 text-[#C24D2C] text-xs font-bold uppercase tracking-widest mb-3">
              <Instagram className="w-4 h-4" />
              <span>Ao Vivo do Forno • #DeolindaNapoletana</span>
            </div>
            <h2 className="font-serif-italian text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#181513]">
              Fotos & Momentos Saindo do Forno
            </h2>
            <p className="text-[#5C554E] text-sm sm:text-base mt-2 max-w-xl">
              Acompanhe as criações quentinhas saindo da pedra vulcânica a 450°C e compartilhe sua foto marcando <strong>@deolindapizzaria</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/deolindapizzaria/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-full bg-white hover:bg-gray-100 text-[#181513] border border-[#E0D5C3] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
            >
              <Instagram className="w-4 h-4 text-[#C24D2C]" />
              <span>Seguir @deolindapizzaria</span>
            </a>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const isLiked = !!likedPosts[post.id];
            return (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="bg-white rounded-3xl overflow-hidden border border-[#E0D5C3] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative h-72 overflow-hidden bg-[#181513]">
                  <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Hot Out of Oven Pill */}
                  {post.isHotOutOfOven && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#C24D2C] text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md animate-pulse">
                      <Flame className="w-3.5 h-3.5 text-[#E5A93C]" />
                      <span>Saindo do Forno 🔥</span>
                    </div>
                  )}

                  {/* Author Header on Top Right */}
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                    {post.author}
                  </div>

                  {/* Bottom Image Stats */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <span className="text-white/80">{post.timestamp}</span>
                    <button
                      onClick={(e) => handleToggleLike(post.id, e)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md transition-all ${
                        isLiked 
                          ? 'bg-[#C24D2C] text-white font-bold scale-105' 
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-white' : 'text-white'}`} />
                      <span>{post.likes}</span>
                    </button>
                  </div>
                </div>

                {/* Caption Body */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <p className="text-xs text-[#5C554E] leading-relaxed line-clamp-3 mb-3">
                    {post.caption}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#F0EAE1]">
                    {post.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[11px] font-semibold text-[#1B382B]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Post Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E0D5C3] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-80 sm:h-96 bg-[#181513]">
              <img
                src={selectedPost.imageUrl}
                alt={selectedPost.caption}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#C24D2C] text-white flex items-center justify-center font-bold text-sm">
                    {selectedPost.author.charAt(1).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#181513]">{selectedPost.author}</h4>
                    <p className="text-[11px] text-[#8C827A]">{selectedPost.timestamp}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleLike(selectedPost.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    likedPosts[selectedPost.id]
                      ? 'bg-[#C24D2C] text-white'
                      : 'bg-[#FAF7F2] text-[#181513] border border-[#E0D5C3]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${likedPosts[selectedPost.id] ? 'fill-current' : ''}`} />
                  <span>{selectedPost.likes} Curtidas</span>
                </button>
              </div>

              <p className="text-sm text-[#5C554E] leading-relaxed">
                {selectedPost.caption}
              </p>

              <div className="pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs text-[#8C827A]">
                <span>Deolinda Pizzaria Napoletana</span>
                <span className="text-[#C24D2C] font-semibold">Forno a Lenha 450°C</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Photo Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E0D5C3] animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#C24D2C]">
                <Camera className="w-5 h-5" />
                <h3 className="font-serif-italian text-xl font-bold text-[#181513]">
                  Compartilhar Foto no Feed
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCommunityPhoto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#5C554E] mb-1">
                  Seu Nome ou Usuário do Instagram *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: @gabriel.gourmet ou Gabriel Silva"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E0D5C3] text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#5C554E] mb-1">
                  Legenda ou Comentário da Pizza
                </label>
                <textarea
                  rows={2}
                  placeholder="Conte o que achou da pizza saindo do forno..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E0D5C3] text-sm focus:outline-none focus:ring-2 focus:ring-[#C24D2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#5C554E] mb-1.5">
                  Escolha o Estilo da Foto da Pizza
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Margherita Verace', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80' },
                    { label: 'Deolinda Trufada', url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=600&q=80' },
                    { label: 'Burrata ao Forno', url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22521?auto=format&fit=crop&w=600&q=80' }
                  ].map((preset, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => setPreviewImage(preset.url)}
                      className={`h-20 rounded-xl overflow-hidden border cursor-pointer relative ${
                        previewImage === preset.url ? 'ring-2 ring-[#C24D2C] border-transparent' : 'border-gray-200'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      {previewImage === preset.url && (
                        <div className="absolute inset-0 bg-[#C24D2C]/40 flex items-center justify-center text-white">
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#C24D2C] hover:bg-[#A63A1E] text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publicar Foto na Galeria</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
