import { ArrowRight, ImageOff, Images } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createSectionBackgroundStyle } from '../lib/siteImages.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const previewLimit = 5

function GallerySection({ images, siteImages = [], backgroundImage }) {
  const [remoteImages, setRemoteImages] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const backgroundStyle = createSectionBackgroundStyle(
    backgroundImage,
    'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,251,245,0.9) 100%)',
  )

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
      className="bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFBF5_100%)] py-16 text-[#0B1026] sm:py-20 lg:py-24"
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
            <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
              {visibleImages.map((image) => (
                <figure
                  key={image.id || image.image_url}
                  className="soft-card-strong group min-w-0 overflow-hidden rounded-[1.35rem] border-[#FFE0CC] p-1.5 sm:rounded-[1.5rem] sm:p-2"
                >
                  <div className="overflow-hidden rounded-[1.15rem] bg-[#FFF1E8]">
                    <img
                      src={image.image_url}
                      alt={image.alt_text || image.alt || image.title || 'Orion Kamp galeri görseli'}
                      className="aspect-[16/11] w-full object-contain transition duration-300 group-hover:scale-105 sm:object-cover"
                      loading="lazy"
                    />
                  </div>
                  {image.title && (
                    <figcaption className="break-words px-2 pb-2 pt-2.5 text-sm font-black leading-snug text-[#0B1026] sm:pt-3">
                      {image.title}
                    </figcaption>
                  )}
                </figure>
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
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#0B1026]/62">
              Admin panelinden aktif görseller eklendiğinde bu alan otomatik olarak dolacak.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default GallerySection
