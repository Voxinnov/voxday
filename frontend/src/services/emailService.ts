import { Quotation } from '../types';

export interface EmailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  attachments?: File[];
}

export class EmailService {
  static async shareQuotationViaEmail(quotation: Quotation, emailData: EmailData): Promise<void> {
    try {
      // Generate PDF attachment
      const pdfBlob = await this.generateQuotationPDFBlob(quotation);
      
      // Create email content
      const emailContent = this.generateEmailContent(quotation, emailData);
      
      // Create mailto link with attachment (note: this has limitations in browsers)
      const mailtoLink = this.createMailtoLink(emailData, emailContent);
      
      // Open email client
      window.open(mailtoLink, '_blank');
      
      // Alternative: Show email content in a modal for copy-paste
      this.showEmailModal(emailContent, pdfBlob, quotation);
      
    } catch (error) {
      console.error('Error sharing quotation via email:', error);
      throw new Error('Failed to share quotation via email');
    }
  }

  private static async generateQuotationPDFBlob(quotation: Quotation): Promise<Blob> {
    // This would typically call the backend to generate PDF
    // For now, we'll create a simple text representation
    const content = this.generateQuotationText(quotation);
    return new Blob([content], { type: 'text/plain' });
  }

  private static generateQuotationText(quotation: Quotation): string {
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

    return `
VOXTREE - Professional Development Services
Quotation #Q${quotation.id.toString().padStart(4, '0')}
Date: ${formatDate(quotation.createdAt)}

CLIENT INFORMATION:
Client: ${quotation.clientName}
Project: ${quotation.projectName}
Type: ${quotation.projectType}
Platform: ${quotation.platform}
${quotation.description ? `Description: ${quotation.description}` : ''}

DEVELOPMENT MODULES:
${quotation.modules.map(module => `
- ${module.moduleName}
  Developer: ${module.developerHours}h @ ${formatCurrency(module.developerRate)}/h
  Designer: ${module.designerHours}h @ ${formatCurrency(module.designerRate)}/h
  Tester: ${module.testerHours}h @ ${formatCurrency(module.testerRate)}/h
  Total: ${formatCurrency(module.total)}
`).join('')}

COST BREAKDOWN:
Development Cost: ${formatCurrency(quotation.totalDevelopmentCost)}
Infrastructure: ${formatCurrency(quotation.infrastructureCost)}
Design & Branding: ${formatCurrency(quotation.designBrandingCost)}
Management Overhead (${quotation.projectManagementPct}%): ${formatCurrency(quotation.projectManagementCost)}
Commission (${quotation.commissionPct}%): ${formatCurrency(quotation.commissionCost)}
Profit Margin (${quotation.profitMarginPct}%): ${formatCurrency(quotation.profitMarginCost)}
Subtotal: ${formatCurrency(quotation.subtotal + quotation.projectManagementCost + quotation.commissionCost + quotation.profitMarginCost)}
GST (${quotation.gstPct}%): ${formatCurrency(quotation.gstAmount)}
FINAL TOTAL: ${formatCurrency(quotation.totalAmount)}

TERMS & CONDITIONS:
- Payment terms: 50% advance, 50% on completion
- Development timeline: As per project requirements
- Revisions: 2 rounds of revisions included
- Support: 3 months free support after delivery
- This quotation is valid for 30 days from the date of issue
- All prices are in Indian Rupees (INR)

Thank you for considering VOXTREE for your project needs.
For any queries, please contact us at info@voxtree.com

Best regards,
VOXTREE Team
    `.trim();
  }

  private static generateEmailContent(quotation: Quotation, emailData: EmailData): string {
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

    return `
Dear ${quotation.clientName},

I hope this email finds you well. Please find attached our detailed quotation for your ${quotation.projectType} project: "${quotation.projectName}".

QUOTATION SUMMARY:
- Quotation #: Q${quotation.id.toString().padStart(4, '0')}
- Date: ${formatDate(quotation.createdAt)}
- Platform: ${quotation.platform}
- Total Amount: ${formatCurrency(quotation.totalAmount)}

PROJECT OVERVIEW:
${quotation.description || 'Please refer to the attached quotation for detailed project specifications.'}

DEVELOPMENT MODULES INCLUDED:
${quotation.modules.map(module => `• ${module.moduleName} - ${formatCurrency(module.total)}`).join('\n')}

NEXT STEPS:
1. Please review the attached quotation document
2. Feel free to reach out if you have any questions or require modifications
3. To proceed, please confirm your acceptance of the terms and conditions
4. We can schedule a call to discuss any specific requirements

TERMS & CONDITIONS:
- Payment: 50% advance, 50% on completion
- Timeline: As per project requirements
- Revisions: 2 rounds included
- Support: 3 months free support after delivery
- Validity: 30 days from issue date

We're excited about the opportunity to work with you on this project. Our team is committed to delivering high-quality solutions that meet your business objectives.

Please don't hesitate to contact me if you need any clarification or have questions about the quotation.

Best regards,
VOXTREE Team
Email: info@voxtree.com
Phone: +91 98765 43210
Website: www.voxtree.com

---
This quotation is generated by VOXTREE Project Management System.
    `.trim();
  }

  private static createMailtoLink(emailData: EmailData, content: string): string {
    const params = new URLSearchParams();
    params.append('to', emailData.to);
    if (emailData.cc) params.append('cc', emailData.cc);
    if (emailData.bcc) params.append('bcc', emailData.bcc);
    params.append('subject', emailData.subject);
    params.append('body', content);
    
    return `mailto:?${params.toString()}`;
  }

  private static showEmailModal(content: string, pdfBlob: Blob, quotation: Quotation): void {
    // Create modal element
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    `;

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #1F2937;">Email Content</h3>
        <button id="closeModal" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email Content (Copy this text):</label>
        <textarea id="emailContent" style="width: 100%; height: 200px; padding: 10px; border: 1px solid #D1D5DB; border-radius: 4px; font-family: monospace; font-size: 12px;" readonly>${content}</textarea>
      </div>
      <div style="margin-bottom: 20px;">
        <button id="copyContent" style="background: #3B82F6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Copy Content</button>
        <button id="downloadPDF" style="background: #10B981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Download PDF</button>
      </div>
      <div style="color: #6B7280; font-size: 14px;">
        <p><strong>Instructions:</strong></p>
        <ol>
          <li>Copy the email content above</li>
          <li>Open your email client</li>
          <li>Paste the content and add the PDF attachment</li>
          <li>Send to the client</li>
        </ol>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('closeModal')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    document.getElementById('copyContent')?.addEventListener('click', () => {
      const textarea = document.getElementById('emailContent') as HTMLTextAreaElement;
      textarea.select();
      document.execCommand('copy');
      alert('Email content copied to clipboard!');
    });

    document.getElementById('downloadPDF')?.addEventListener('click', () => {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quotation_${quotation.id}_${quotation.clientName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
}
