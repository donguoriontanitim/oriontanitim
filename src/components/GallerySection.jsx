import { ArrowRight, ImageOff, Images, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createSectionBackgroundStyle } from '../lib/siteImages.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const previewLimit = 6

function GallerySection({ images, siteImages = [], backgroundImage }) {
  const [remoteImages, setRemoteImages] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const backgroundStyle = createSectionBackgroundStyle(backgroundImage)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let isMounted = true

    supabase
      .from('gallery_images')
      .select('id,title,description,image_url,alt_text,sort_order,is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (isMounted) {
          setRemoteImages(data || [])
        }
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedImage) {
      return undefined
    }

    const originalOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedImage(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedImage])

  const activeImages = useMemo(
    () => {
      const sourceImages = siteImages.length > 0 ? siteImages : remoteImages?.length ? remoteImages : images

      return [...(sourceImages || [])]
        .filter((image) => image.is_active !== false && image.image_url)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    },
    [images, remoteImages, siteImages],
  )

  const visibleImages = showAll ? activeImages : activeImages.slice(0, previewLimit)
  const hasMoreImages = activeImages.length > previewLimit

  return (
    <section
      id="galeri"
      className="section-background-frame bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFBF5_100%)] py-12 text-[#222222] sm:py-14 lg:py-16"
      style={backgroundStyle}
    >
      <div className="section-shell">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="section-eyebrow inline-flex items-center gap-2">
              <Images size={16} aria-hidden="true" />
              KAMPTAN KARELER
            </p>
            <h2 className="mt-3 text-2xl font-black leading-tight min-[390px]:text-3xl sm:text-4xl lg:text-5xl">
              Kamp atmosferinden temiz, sıcak ve renkli anlar.
            </h2>
          </div>

          {hasMoreImages && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="orion-gradient orion-gradient-hover cta-orange hidden w-fit items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white transition sm:inline-flex"
            >
              {showAll ? 'Daha Az Göster' : 'Tüm Galeriyi Görüntüle'}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          )}
        </div>

        {activeImages.length > 0 ? (
          <>
            <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {visibleImages.map((image) => (
                <button
                  type="button"
                  key={image.id || image.image_url}
                  onClick={() => setSelectedImage(image)}
                  className="soft-card-strong group min-w-0 overflow-hidden rounded-[1.35rem] border-[#FFE0CC] p-2 text-left transition hover:-translate-y-1 sm:rounded-[1.5rem] sm:p-2.5"
                  aria-label={`${image.title || 'Galeri görseli'} görselini büyük aç`}
                >
                  <div className="overflow-hidden rounded-[1.15rem] bg-[#FFF1E8]">
                    <img
                      src={image.image_url}
                      alt={image.alt_text || image.alt || image.title || 'Orion Kamp galeri görseli'}
                      className="aspect-[16/10] w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  {image.title && (
                    <span className="block break-words px-2 pb-2 pt-3 text-base font-black leading-snug text-[#222222]">
                      {image.title}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {hasMoreImages && (
              <div className="mt-8 flex justify-center sm:hidden">
                <button
                  type="button"
                  onClick={() => setShowAll((current) => !current)}
                  className="landing-soft-button"
                >
                  {showAll ? 'Daha Az Göster' : 'Tüm Galeriyi Görüntüle'}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="soft-card-strong mt-10 flex flex-col items-center justify-center rounded-[1.75rem] p-8 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[#FFF1E8] text-[#FF6A2A]">
              <ImageOff size={25} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xl font-black">Galeri yakında güncellenecek.</h3>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#222222]/62">
              Admin panelinden aktif görseller eklendiğinde bu alan otomatik olarak dolacak.
            </p>
          </div>
        )}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#222222]/74 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.title || 'Galeri görseli'}
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-[#FFE0CC] bg-white p-2 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:rounded-[2rem] sm:p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white text-[#222222] shadow-[0_12px_32px_rgba(11,16,38,0.18)] transition hover:bg-[#FFF1E8] hover:text-[#FF6A2A]"
              aria-label="Galeri görselini kapat"
            >
              <X size={20} aria-hidden="true" />
            </button>
            <img
              src={selectedImage.image_url}
              alt={selectedImage.alt_text || selectedImage.alt || selectedImage.title || 'Orion Kamp galeri görseli'}
              className="max-h-[78vh] w-full rounded-[1.15rem] bg-[#FFF8F0] object-contain sm:rounded-[1.5rem]"
            />
            {(selectedImage.title || selectedImage.description) && (
              <div className="px-3 pb-3 pt-4 sm:px-4">
                {selectedImage.title && (
                  <h3 className="text-xl font-black leading-tight text-[#222222]">
                    {selectedImage.title}
                  </h3>
                )}
                {selectedImage.description && (
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#222222]/66">
                    {selectedImage.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default GallerySection
