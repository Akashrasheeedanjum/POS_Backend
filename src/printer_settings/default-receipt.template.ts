export const DEFAULT_RECEIPT_TEMPLATE = `<div style="font-family: Arial, sans-serif; max-width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; color: #111;">
  <h2 style="text-align: center; margin: 0 0 8px;">{{data.companyName}}</h2>
  <p style="text-align: center; margin: 0 0 12px; font-size: 11px;">
    {{data.companyStreetAddress}}<br/>
    {{data.companyCityAddress}}<br/>
    {{data.companyCountry}}<br/>
    Tel: {{data.companyTelphone}}
  </p>
  <hr style="border: none; border-top: 1px dashed #999; margin: 10px 0;" />
  <p style="margin: 4px 0;"><strong>Receipt No:</strong> {{data.factureNumber}}</p>
  <p style="margin: 4px 0;"><strong>Date:</strong> {{data.date}}</p>
  <p style="margin: 4px 0;"><strong>Customer:</strong> {{data.customerName}} ({{data.customerCode}})</p>
  <p style="margin: 4px 0; font-size: 11px;">{{data.customerStreetAddress}}, {{data.customerCityAddress}}</p>
  <div style="margin: 12px 0;">{{{confirmInvoiceTableDemo}}}</div>
  <p style="margin: 4px 0; text-align: right;"><strong>Subtotal:</strong> Rs {{data.totalHT}}</p>
  <p style="margin: 4px 0; text-align: right;"><strong>GST:</strong> Rs {{data.TVA}}</p>
  <p style="margin: 8px 0; text-align: right; font-size: 14px;"><strong>Total:</strong> Rs {{data.totalTTC}}</p>
  <div style="margin: 12px 0;">{{{confirmPaymentMethodsDemo}}}</div>
  <p style="text-align: center; margin-top: 16px; font-size: 11px;">Thank you for your business!</p>
</div>`;
