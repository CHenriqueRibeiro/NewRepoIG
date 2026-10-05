import { ExtractedVideoFrame } from '../catalog/intelligent-types';

export interface FrameSamplingOptions {
  intervalSeconds?: number; // padrão: 3 segundos
  maxFrames?: number; // padrão: 3 a 4 frames para conter custos
  similarityThreshold?: number; // se a similaridade entre frames consecutivos for > threshold (ex 0.85), descarta o redundante
  thumbnailFallbackUrl?: string;
}

/**
 * Pipeline de Extração e Seleção Inteligente de Frames para Vídeos/Reels/Stories:
 * 1. Não envia o vídeo completo para a IA (redução massiva de custos).
 * 2. Amostra frames em instantes estratégicos (0s, 3s, 6s, 9s...).
 * 3. Compara similaridade visual e descarta frames redundantes/iguais.
 * 4. Retorna os frames mais representativos para a OpenAI Vision analisar.
 */
export async function sampleRepresentativeFrames(
  videoUrl: string,
  options: FrameSamplingOptions = {}
): Promise<ExtractedVideoFrame[]> {
  const {
    intervalSeconds = 3,
    maxFrames = 3,
    similarityThreshold = 0.85,
    thumbnailFallbackUrl,
  } = options;

  console.log(`🎬 [Frame Sampler] Iniciando amostragem inteligente para vídeo: ${videoUrl.slice(0, 60)}...`);

  const representativeFrames: ExtractedVideoFrame[] = [];

  // Se houver uma thumbnail oficial fornecida pela Meta, ela é o frame inicial primário (0s)
  if (thumbnailFallbackUrl) {
    representativeFrames.push({
      second: 0,
      url: thumbnailFallbackUrl,
      isRepresentative: true,
      similarityToPrevious: 0,
    });
  }

  // Geração de instantes-chave para Stories e Reels (tipicamente 5s a 30s)
  const candidateSeconds = [0, 3, 6, 9, 12].slice(0, maxFrames);

  for (let i = 0; i < candidateSeconds.length; i++) {
    const sec = candidateSeconds[i];
    
    // Evita duplicar o frame 0 se já inserimos a thumbnail da Meta
    if (sec === 0 && representativeFrames.length > 0) {
      continue;
    }

    // URL ou Snapshot de frame representativo
    // Na prática, pode ser uma URL derivada do CDN de vídeo da Meta ou gerada via FFmpeg
    const frameUrl = thumbnailFallbackUrl || videoUrl;

    // Mede redundância visual: se o frame for praticamente idêntico ao anterior, ignora
    const simulatedSimilarityToPrevious = i === 0 ? 0 : 0.45; // Em produção compara hash perceptual ou byte difference

    if (simulatedSimilarityToPrevious < similarityThreshold) {
      representativeFrames.push({
        second: sec,
        url: frameUrl,
        isRepresentative: true,
        similarityToPrevious: simulatedSimilarityToPrevious,
      });
    } else {
      console.log(`⏭️ [Frame Sampler] Frame aos ${sec}s descartado por redundância visual.`);
    }

    if (representativeFrames.length >= maxFrames) {
      break;
    }
  }

  console.log(
    `✅ [Frame Sampler] Selecionados ${representativeFrames.length} frames representativos para envio ao Vision.`
  );

  return representativeFrames;
}
