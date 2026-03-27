import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Quotation } from '../types';

export class PDFService {
  static async generateQuotationPDF(quotation: Quotation): Promise<void> {
    try {
      // Create a temporary element to render the quotation
      const tempElement = document.createElement('div');
      tempElement.style.position = 'absolute';
      tempElement.style.left = '-9999px';
      tempElement.style.top = '0';
      tempElement.style.width = '210mm'; // A4 width
      tempElement.innerHTML = this.generateQuotationHTML(quotation);
      
      document.body.appendChild(tempElement);

      // Convert to canvas
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove temporary element
      document.body.removeChild(tempElement);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const fileName = `Quotation_${quotation.id}_${quotation.clientName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  private static generateQuotationHTML(quotation: Quotation): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'draft': return '#6B7280';
        case 'sent': return '#3B82F6';
        case 'accepted': return '#10B981';
        case 'rejected': return '#EF4444';
        case 'expired': return '#F59E0B';
        default: return '#6B7280';
      }
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Quotation ${quotation.id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            background: linear-gradient(135deg, #3B82F6, #1E40AF);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            margin-bottom: 0;
          }
          
          .company-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .company-details h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .company-details p {
            font-size: 14px;
            opacity: 0.9;
            margin: 2px 0;
          }
          
          .quotation-info {
            text-align: right;
          }
          
          .quotation-info h2 {
            font-size: 24px;
            margin-bottom: 10px;
          }
          
          .quotation-info p {
            font-size: 14px;
            margin: 2px 0;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: ${getStatusColor(quotation.status)}20;
            color: ${getStatusColor(quotation.status)};
            margin-top: 8px;
          }
          
          .client-section {
            padding: 30px;
            border: 1px solid #E5E7EB;
            border-top: none;
            display: flex;
            justify-content: space-between;
          }
          
          .client-info h3, .quotation-details h3 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #1F2937;
          }
          
          .client-info p, .quotation-details p {
            margin: 5px 0;
            font-size: 14px;
          }
          
          .modules-section {
            padding: 30px;
            border: 1px solid #E5E7EB;
            border-top: none;
          }
          
          .modules-section h3 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #1F2937;
          }
          
          .modules-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .modules-table th {
            background-color: #F9FAFB;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
            color: #6B7280;
            text-transform: uppercase;
            border: 1px solid #E5E7EB;
          }
          
          .modules-table td {
            padding: 12px;
            border: 1px solid #E5E7EB;
            font-size: 14px;
          }
          
          .modules-table tr:nth-child(even) {
            background-color: #F9FAFB;
          }
          
          .cost-breakdown {
            padding: 30px;
            border: 1px solid #E5E7EB;
            border-top: none;
          }
          
          .cost-breakdown h3 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #1F2937;
          }
          
          .cost-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .cost-table th {
            background-color: #F9FAFB;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 12px;
            color: #6B7280;
            text-transform: uppercase;
            border: 1px solid #E5E7EB;
          }
          
          .cost-table td {
            padding: 12px;
            border: 1px solid #E5E7EB;
            font-size: 14px;
          }
          
          .cost-table .subtotal-row {
            border-top: 2px solid #D1D5DB;
            font-weight: bold;
            background-color: #F9FAFB;
          }
          
          .cost-table .total-row {
            border-top: 2px solid #3B82F6;
            background-color: #EFF6FF;
            font-weight: bold;
            font-size: 16px;
            color: #1E40AF;
          }
          
          .terms-section {
            padding: 30px;
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-top: none;
          }
          
          .terms-section h3 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #1F2937;
          }
          
          .terms-section ul {
            list-style: none;
            padding: 0;
          }
          
          .terms-section li {
            margin: 8px 0;
            font-size: 14px;
            color: #6B7280;
          }
          
          .terms-section li:before {
            content: "•";
            color: #3B82F6;
            font-weight: bold;
            margin-right: 8px;
          }
          
          .footer {
            padding: 20px;
            text-align: center;
            color: #6B7280;
            font-size: 14px;
            border: 1px solid #E5E7EB;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="company-info">
              <div class="company-details">
                <h1>VOXTREE</h1>
                <p>Professional Development Services</p>
                <p>Email: info@voxtree.com</p>
                <p>Phone: +91 98765 43210</p>
                <p>Website: www.voxtree.com</p>
              </div>
              <div class="quotation-info">
                <h2>QUOTATION</h2>
                <p>Quotation #: Q${quotation.id.toString().padStart(4, '0')}</p>
                <p>Date: ${formatDate(quotation.createdAt)}</p>
                <div class="status-badge">${quotation.status.toUpperCase()}</div>
              </div>
            </div>
          </div>

          <!-- Client Information -->
          <div class="client-section">
            <div class="client-info">
              <h3>Bill To:</h3>
              <p><strong>${quotation.clientName}</strong></p>
              <p>Project: ${quotation.projectName}</p>
              <p>Type: ${quotation.projectType}</p>
              <p>Platform: ${quotation.platform}</p>
              ${quotation.description ? `<p>Description: ${quotation.description}</p>` : ''}
            </div>
            <div class="quotation-details">
              <h3>Quotation Details:</h3>
              <p><strong>Quotation ID:</strong> Q${quotation.id.toString().padStart(4, '0')}</p>
              <p><strong>Created:</strong> ${formatDate(quotation.createdAt)}</p>
              ${quotation.validUntil ? `<p><strong>Valid Until:</strong> ${formatDate(quotation.validUntil)}</p>` : ''}
              <p><strong>Status:</strong> ${quotation.status.toUpperCase()}</p>
            </div>
          </div>

          <!-- Development Modules -->
          <div class="modules-section">
            <h3>Development Modules</h3>
            <table class="modules-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Developer Hours</th>
                  <th>Designer Hours</th>
                  <th>Tester Hours</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                ${quotation.modules.map(module => `
                  <tr>
                    <td>${module.moduleName}</td>
                    <td>${module.developerHours}h @ ${formatCurrency(module.developerRate)}/h</td>
                    <td>${module.designerHours}h @ ${formatCurrency(module.designerRate)}/h</td>
                    <td>${module.testerHours}h @ ${formatCurrency(module.testerRate)}/h</td>
                    <td>${formatCurrency(module.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Cost Breakdown -->
          <div class="cost-breakdown">
            <h3>Cost Breakdown</h3>
            <table class="cost-table">
              <tbody>
                <tr>
                  <td>Development Cost</td>
                  <td>Total developer hours × rate</td>
                  <td style="text-align: right;">${formatCurrency(quotation.totalDevelopmentCost)}</td>
                </tr>
                <tr>
                  <td>Infrastructure</td>
                  <td>Hosting, domain, etc.</td>
                  <td style="text-align: right;">${formatCurrency(quotation.infrastructureCost)}</td>
                </tr>
                <tr>
                  <td>Design/Branding</td>
                  <td>Logo, UI Kit</td>
                  <td style="text-align: right;">${formatCurrency(quotation.designBrandingCost)}</td>
                </tr>
                <tr>
                  <td>Management Overhead</td>
                  <td>${quotation.projectManagementPct}% of subtotal</td>
                  <td style="text-align: right;">${formatCurrency(quotation.projectManagementCost)}</td>
                </tr>
                <tr>
                  <td>Commission</td>
                  <td>${quotation.commissionPct}% of subtotal</td>
                  <td style="text-align: right;">${formatCurrency(quotation.commissionCost)}</td>
                </tr>
                <tr>
                  <td>Profit</td>
                  <td>${quotation.profitMarginPct}% of subtotal</td>
                  <td style="text-align: right;">${formatCurrency(quotation.profitMarginCost)}</td>
                </tr>
                <tr class="subtotal-row">
                  <td><strong>Subtotal</strong></td>
                  <td>Before GST</td>
                  <td style="text-align: right;"><strong>${formatCurrency(quotation.subtotal + quotation.projectManagementCost + quotation.commissionCost + quotation.profitMarginCost)}</strong></td>
                </tr>
                <tr>
                  <td>GST (${quotation.gstPct}%)</td>
                  <td>Tax on subtotal</td>
                  <td style="text-align: right;">${formatCurrency(quotation.gstAmount)}</td>
                </tr>
                <tr class="total-row">
                  <td><strong>Final Total</strong></td>
                  <td>Total amount including all costs</td>
                  <td style="text-align: right;"><strong>${formatCurrency(quotation.totalAmount)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Terms and Conditions -->
          <div class="terms-section">
            <h3>Terms & Conditions</h3>
            <ul>
              <li>Payment terms: 50% advance, 50% on completion</li>
              <li>Development timeline: As per project requirements</li>
              <li>Revisions: 2 rounds of revisions included</li>
              <li>Support: 3 months free support after delivery</li>
              <li>This quotation is valid for 30 days from the date of issue</li>
              <li>All prices are in Indian Rupees (INR) and exclude applicable taxes</li>
            </ul>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Thank you for considering VOXTREE for your project needs.</p>
            <p>For any queries, please contact us at info@voxtree.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}



