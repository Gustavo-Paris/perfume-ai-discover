export interface CompanySettings {
  id: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento?: string;
  endereco_bairro: string;
  endereco_cep: string;
  endereco_cidade: string;
  endereco_uf: string;
  endereco_codigo_municipio: string;
  telefone?: string;
  email: string;
  regime_tributario: string;
  certificado_a1_base64?: string;
  certificado_senha?: string;
  ambiente_nfe: string;
  focus_nfe_token?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFiscalData {
  id: string;
  perfume_id: string;
  ncm: string;
  cfop: string;
  cest?: string;
  origem_mercadoria: string;
  icms_situacao_tributaria: string;
  icms_aliquota: number;
  pis_situacao_tributaria: string;
  pis_aliquota: number;
  cofins_situacao_tributaria: string;
  cofins_aliquota: number;
  ipi_situacao_tributaria: string;
  ipi_aliquota: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface FiscalNote {
  id: string;
  order_id: string;
  numero: number;
  serie: number;
  chave_acesso?: string;
  status: string;
  protocolo_autorizacao?: string;
  data_emissao: string;
  data_autorizacao?: string;
  valor_total: number;
  valor_produtos: number;
  valor_icms: number;
  valor_pis: number;
  valor_cofins: number;
  valor_ipi: number;
  xml_content?: string;
  pdf_url?: string;
  focus_nfe_ref?: string;
  erro_message?: string;
  created_at: string;
  updated_at: string;
}

export interface FiscalNoteItem {
  id: string;
  fiscal_note_id: string;
  order_item_id: string;
  numero_item: number;
  codigo_produto: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade_comercial: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  valor_icms: number;
  valor_pis: number;
  valor_cofins: number;
  valor_ipi: number;
  created_at: string;
}

export interface FocusNFERequest {
  cnpj_emitente: string;
  natureza_operacao: string;
  serie: number;
  numero: number;
  data_emissao: string;
  tipo_documento: number;
  presenca_comprador: number;
  modalidade_frete: number;
  destino: {
    cpf_cnpj: string;
    nome: string; 
    endereco: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cep: string;
    cidade: string;
    uf: string;
    telefone?: string;
    email?: string;
  };
  itens: Array<{
    numero_item: number;
    codigo_produto: string;
    descricao: string;
    cfop: string;
    unidade_comercial: string;
    quantidade: number;
    valor_unitario: number;
    valor_bruto: number;
    ncm: string;
    origem: string;
    icms: {
      situacao_tributaria: string;
      aliquota?: number;
      valor?: number;
    };
    pis: {
      situacao_tributaria: string;
      aliquota?: number;
      valor?: number;
    };
    cofins: {
      situacao_tributaria: string;
      aliquota?: number;
      valor?: number;
    };
  }>;
}

export interface FocusNFEResponse {
  status: string;
  status_sefaz: string;
  mensagem_sefaz: string;
  chave_nfe: string;
  numero: string;
  serie: string;
  caminho_xml_nota_fiscal: string;
  caminho_danfe: string;
  protocolo: string;
  ref: string;
}