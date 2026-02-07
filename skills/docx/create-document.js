const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = require('docx');
const fs = require('fs');

// Create document with proper styling following docx-js best practices
const doc = new Document({
  styles: {
    default: { 
      document: { 
        run: { font: "Arial", size: 24 } // 12pt default
      } 
    },
    paragraphStyles: [
      // Document title style - override built-in Title style
      { 
        id: "Title", 
        name: "Title", 
        basedOn: "Normal",
        run: { size: 56, bold: true, color: "000000", font: "Arial" }, // 28pt
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } 
      },
      // Override built-in heading styles
      { 
        id: "Heading1", 
        name: "Heading 1", 
        basedOn: "Normal", 
        next: "Normal", 
        quickFormat: true,
        run: { size: 32, bold: true, color: "000000", font: "Arial" }, // 16pt
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 } 
      },
      { 
        id: "Heading2", 
        name: "Heading 2", 
        basedOn: "Normal", 
        next: "Normal", 
        quickFormat: true,
        run: { size: 28, bold: true, color: "000000", font: "Arial" }, // 14pt
        paragraph: { spacing: { before: 180, after: 180 }, outlineLevel: 1 } 
      }
    ]
  },
  sections: [{
    properties: { 
      page: { 
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
      } 
    },
    children: [
      // Centered header/title
      new Paragraph({ 
        heading: HeadingLevel.TITLE, 
        children: [new TextRun("Centered Support Service Employment Agreement")] 
      }),
      
      // Document content sections
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("1. Employment Agreement")] 
      }),
      new Paragraph({ 
        children: [new TextRun("This employment agreement is made between the support service provider and the employee, outlining the terms and conditions of employment.")]
      }),
      
      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("1.1 Position and Responsibilities")] 
      }),
      new Paragraph({ 
        children: [new TextRun("The employee agrees to perform the duties and responsibilities assigned by the employer, including but not limited to providing support services as required.")]
      }),
      
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("2. Terms of Employment")] 
      }),
      new Paragraph({ 
        children: [new TextRun("The employment shall commence on the agreed start date and continue until terminated according to the terms outlined in this agreement.")]
      }),
      
      new Paragraph({ 
        heading: HeadingLevel.HEADING_2, 
        children: [new TextRun("2.1 Compensation")] 
      }),
      new Paragraph({ 
        children: [new TextRun("The employee shall receive compensation as agreed upon, with payment schedules and benefits as outlined in the company policy.")]
      }),
      
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("3. Confidentiality")] 
      }),
      new Paragraph({ 
        children: [new TextRun("The employee agrees to maintain confidentiality regarding all company information and client data both during and after employment.")]
      }),
      
      new Paragraph({ 
        heading: HeadingLevel.HEADING_1, 
        children: [new TextRun("4. Termination")] 
      }),
      new Paragraph({ 
        children: [new TextRun("Either party may terminate this employment agreement according to the terms and conditions specified herein.")]
      }),
      
      // Signature section with proper spacing
      new Paragraph({ 
        spacing: { before: 480, after: 240 } // Add space before signature section
      }),
      
      new Paragraph({ 
        children: [new TextRun("________________________________________")] 
      }),
      new Paragraph({ 
        children: [new TextRun("Employer Signature")] 
      }),
      new Paragraph({ 
        spacing: { after: 240 }
      }),
      
      new Paragraph({ 
        children: [new TextRun("________________________________________")] 
      }),
      new Paragraph({ 
        children: [new TextRun("Employee Signature")] 
      }),
      new Paragraph({ 
        spacing: { after: 240 }
      }),
      
      new Paragraph({ 
        children: [new TextRun("Date: ___________________________")] 
      })
    ]
  }]
});

// Generate and save the document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Centered_Support_Service_Employment_Agreement_DSS.docx", buffer);
  console.log("Document created successfully: Centered_Support_Service_Employment_Agreement_DSS.docx");
}).catch(error => {
  console.error("Error creating document:", error);
});
