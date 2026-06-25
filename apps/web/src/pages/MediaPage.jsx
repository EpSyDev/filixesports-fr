
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useMedia } from '@/hooks/useMedia';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video } from 'lucide-react';

const MediaPage = () => {
  const { media, loading } = useMedia();

  const photos = media.filter(m => m.type === 'photo');
  const videos = media.filter(m => m.type === 'video');

  return (
    <>
      <Helmet>
        <title>Média - KOTIYA FC</title>
        <meta name="description" content="Galerie photos et vidéos du KOTIYA FC" />
      </Helmet>

      <div className="min-h-screen bg-transparent">
        <Header />

        <section className="py-10 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.35em] text-primary/90 block mb-3">Médias</span>
              <h1 className="font-display uppercase text-5xl md:text-6xl mb-4">
                Galerie <span className="text-primary">Média</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Photos et vidéos de nos matchs et événements
              </p>
            </motion.div>

            <Tabs defaultValue="photos" className="w-full">
              <div className="flex justify-center mb-8">
              <TabsList className="gap-1">
                <TabsTrigger value="photos" className="gap-2">
                  <Image className="w-4 h-4" />
                  Photos
                </TabsTrigger>
                <TabsTrigger value="videos" className="gap-2">
                  <Video className="w-4 h-4" />
                  Vidéos
                </TabsTrigger>
              </TabsList>
              </div>

              <TabsContent value="photos">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-video rounded-xl" />
                    ))}
                  </div>
                ) : photos.length > 0 ? (
                  <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
                    {photos.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="group relative break-inside-avoid mb-6 w-full rounded-xl overflow-hidden"
                      >
                        <img
                          src={item.url}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-auto block transition-all duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                          <div>
                            <h3 className="font-bold text-lg">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Aucune photo pour le moment</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="videos">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-video rounded-xl" />
                    ))}
                  </div>
                ) : videos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {videos.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="space-y-3"
                      >
                        <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                          <video 
                            src={item.url}
                            controls
                            className="w-full h-full"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold">{item.title}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Aucune vidéo pour le moment</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default MediaPage;
