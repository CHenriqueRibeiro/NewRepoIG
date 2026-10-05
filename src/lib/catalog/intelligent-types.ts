/**
-- =====================================================================
-- VITRYNE - TIPOS E MODELOS PARA O CATÁLOGO INTELIGENTE
-- Suporta qualquer categoria de produto com atributos dinâmicos JSON
-- =====================================================================
*/

export interface ProductDynamicAttributes {
  categoria?: string; // ex: blusa, vestido, calçado, semijoia, celular, sofá
  subcategoria?: string;
  cor_principal?: string; // ex: amarelo, preto, dourado, off-white
  cores_secundarias?: string[];
  gola?: string; // ex: V, redonda, polo, canoa, alta
  manga?: string; // ex: curta, longa, regata, bufante
  cor_manga?: string;
  detalhes?: string[]; // ex: ['branco', 'babado', 'bolso frontal', 'fivela']
  estampa?: string; // ex: floral, lisa, xadrez, animal print, listrada
  modelagem?: string; // ex: regular, slim, oversized, cropped, evasê
  material?: string; // ex: algodão, linho, seda, viscose, ouro 18k, couro
  genero?: string; // ex: feminino, masculino, unissex
  estilo?: string; // ex: casual, festa, alfaiataria, praia, esportivo
  [key: string]: any; // Extensível para calçados, bolsas, joias, carros, eletrônicos, móveis, etc.
}

export interface ProductVariantEntity {
  id: string;
  product_id: string;
  name: string; // ex: 'P', 'M', 'G', '38', '40', 'Amarelo / P'
  sku?: string;
  price_cents?: number;
  stock_quantity: number;
  attributes?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImageEntity {
  id: string;
  product_id: string;
  url: string;
  is_primary?: boolean;
  source_type: 'catalog' | 'instagram_post' | 'instagram_story' | 'instagram_reel' | 'video_frame';
  source_media_id?: string;
  source_frame_second?: number;
  embedding?: number[];
  created_at?: string;
}

export interface ProductEntity {
  id: string;
  store_id: string;
  title: string;
  description?: string;
  canonical_description?: string;
  price_cents: number;
  is_unique_piece?: boolean;
  stock_quantity: number;
  image_url?: string;
  category?: string;
  sku?: string;
  status: 'active' | 'inactive' | 'sold_out';
  attributes: ProductDynamicAttributes;
  variants?: ProductVariantEntity[];
  images?: ProductImageEntity[];
  created_at?: string;
  updated_at?: string;
}

export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'STORY' | 'REEL';

export type MediaProcessingStatus = 'pending' | 'processing' | 'processed' | 'error' | 'skipped';

export interface ExtractedVideoFrame {
  second: number;
  url: string;
  isRepresentative?: boolean;
  similarityToPrevious?: number;
}

export interface InstagramMediaEntity {
  id: string;
  store_id: string;
  instagram_media_id: string; // ID oficial Meta para Idempotência absoluta
  media_type: InstagramMediaType;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  timestamp?: string;
  status: MediaProcessingStatus;
  extracted_attributes?: ProductDynamicAttributes;
  canonical_description?: string;
  extracted_frames?: ExtractedVideoFrame[];
  embedding?: number[];
  error_message?: string;
  created_at?: string;
  processed_at?: string;
}

export type MatchStatus =
  | 'auto_matched' // Confiança alta (>= 0.85) -> Match Automático
  | 'pending_confirmation' // Confiança moderada (0.50 a 0.84) -> Perguntar à dona da loja
  | 'confirmed' // Confirmado manualmente pelo usuário
  | 'rejected' // Rejeitado manualmente pelo usuário
  | 'suggested_new'; // Sem match relevante (< 0.50) -> Sugerir novo produto

export interface CandidateProductMatch {
  product_id: string;
  title: string;
  category?: string;
  price_cents?: number;
  image_url?: string;
  confidence: number;
  similarity: number;
  reason: string;
  matchedAttributes: string[];
  divergentAttributes: string[];
}

export interface InstagramMediaProductRelation {
  id: string;
  media_id: string;
  product_id?: string;
  confidence: number;
  match_status: MatchStatus;
  match_reason?: string;
  attribute_comparison?: {
    visual_similarity: number;
    category_match: boolean;
    color_match: boolean;
    attributes_match_score: number;
    divergent_points?: string[];
  };
  candidates?: CandidateProductMatch[];
  created_at?: string;
  confirmed_at?: string;
  // Campos populados em queries
  product?: ProductEntity;
  media?: InstagramMediaEntity;
}

export interface ConversationContextEntity {
  id: string;
  store_id: string;
  buyer_id: string; // senderId do Instagram
  buyer_username?: string;
  current_product_id?: string;
  last_media_id?: string;
  last_interaction_at: string;
  metadata?: Record<string, any>;
  current_product?: ProductEntity;
}

export interface MatchDecisionResult {
  decision: 'strong_match' | 'doubtful_match' | 'no_match';
  match_status: MatchStatus;
  confidence: number;
  matched_product?: ProductEntity;
  candidates: CandidateProductMatch[];
  extracted_attributes: ProductDynamicAttributes;
  canonical_description: string;
  explanation: string;
}

export interface PriceConfirmationRequest {
  id: string;
  store_id: string;
  product_id: string;
  product_title: string;
  product_image_url?: string;
  buyer_username: string;
  buyer_id: string;
  inquiry_text: string;
  status: 'pending' | 'confirmed';
  confirmed_price_cents?: number;
  created_at: string;
  confirmed_at?: string;
}
