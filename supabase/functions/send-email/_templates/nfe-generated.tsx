import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface NFEGeneratedEmailProps {
  customerName: string;
  orderNumber: string;
  nfeNumber: number;
  nfeKey: string;
  pdfUrl: string;
}

export const NFEGeneratedEmail = ({
  customerName,
  orderNumber,
  nfeNumber,
  nfeKey,
  pdfUrl
}: NFEGeneratedEmailProps) => (
  <Html>
    <Head />
    <Preview>Sua Nota Fiscal Eletrônica foi gerada</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nota Fiscal Eletrônica</Heading>
        
        <Text style={text}>
          Olá {customerName},
        </Text>
        
        <Text style={text}>
          Sua Nota Fiscal Eletrônica referente ao pedido <strong>#{orderNumber}</strong> foi emitida com sucesso!
        </Text>
        
        <div style={infoBox}>
          <Text style={infoText}>
            <strong>Número da NF-e:</strong> {nfeNumber}
          </Text>
          <Text style={infoCode}>
            <strong>Chave de Acesso:</strong><br />
            <code style={code}>{nfeKey}</code>
          </Text>
        </div>
        
        <div style={buttonContainer}>
          <Button
            href={pdfUrl}
            style={button}
          >
            Baixar NF-e (PDF)
          </Button>
        </div>
        
        <Text style={text}>
          Você pode usar a chave de acesso acima para:
        </Text>
        
        <ul style={list}>
          <li>Consultar sua NF-e no portal da Receita Federal</li>
          <li>Validar a autenticidade do documento</li>
          <li>Fazer a escrituração fiscal (se necessário)</li>
        </ul>
        
        <Text style={text}>
          <strong>Importante:</strong> Guarde bem esta nota fiscal, pois ela é necessária para:
          garantia dos produtos, trocas, devoluções e comprovante de compra.
        </Text>
        
        <Text style={footer}>
          <Link
            href="https://sua-perfumaria.com"
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            Sua Perfumaria
          </Link>
          <br />
          Obrigado pela preferência!
        </Text>
      </Container>
    </Body>
  </Html>
)

export default NFEGeneratedEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '14px',
  margin: '24px 0',
  lineHeight: '1.5',
}

const infoBox = {
  backgroundColor: '#f6f9fc',
  border: '1px solid #e1e8ed',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const infoText = {
  color: '#333',
  fontSize: '14px',
  margin: '8px 0',
  lineHeight: '1.5',
}

const infoCode = {
  color: '#333',  
  fontSize: '12px',
  margin: '8px 0',
  lineHeight: '1.5',
}

const code = {
  backgroundColor: '#f4f4f4',
  border: '1px solid #ddd',
  borderRadius: '4px',
  color: '#333',
  display: 'inline-block',
  fontSize: '11px',
  fontFamily: 'monospace',
  padding: '8px 12px',
  wordBreak: 'break-all' as const,
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '14px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  fontWeight: 'bold',
}

const list = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '1.5',
  paddingLeft: '20px',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
  textAlign: 'center' as const,
}

const link = {
  color: '#007ee6',
  textDecoration: 'underline',
}