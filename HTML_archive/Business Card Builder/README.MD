Business Card Generator

This is a simple, interactive web application that allows you to design and generate print-ready business cards directly in your browser. Customize your name, title, company, contact information, and even upload your own logo. Once satisfied, you can generate a high-quality PDF file suitable for professional printing.
Features

    Real-time Preview: See your business card design update instantly as you type and make selections.

    Customizable Fields: Easily input your name, title, company, phone, email, website, address, and social media links.

    Logo Upload: Upload your company logo (PNG, JPG, SVG) for both front and back sides of the card.

    Color Themes: Choose from predefined color themes to match your brand or preference.

    Text Layout Options: Select different text alignment (left, right, center) for the front side.

    Two-Sided Design: Design both the front and back of your business card.

    Print-Ready PDF Generation: Export your design as a PDF file with standard business card dimensions (3.5" x 2") and included bleed for professional printing.

How to Use

    Open the Application: Open the index.html file in your web browser.

    Input Your Information:

        In the "Customize Your Business Card" section, fill in all the relevant details for your business card, such as your name, title, company, and contact information.

        Use the "Back Side Content (Optional)" section for additional details like your address, social media link, and a tagline.

    Upload Your Logo:

        Click on the "Upload Logo" box or drag and drop your logo file into it. A preview of your logo will appear.

    Choose Design Options:

        Select a "Color Theme" that suits your style.

        Choose a "Text Layout" (Left, Right, or Center) for the front side of your card.

    Preview Your Card:

        Use the "View Side" radio buttons to switch between the "Front" and "Back" previews of your business card.

    Generate PDF:

        Once you are happy with your design, click the "Generate PDF" button. A PDF file named business_card.pdf will be downloaded to your computer.

Customization Options (for Developers)

The application is built with HTML, CSS (Tailwind CSS), and JavaScript (jsPDF for PDF generation).

    Styling:

        All styling is done using Tailwind CSS classes directly in the HTML and a custom <style> block for specific layout and responsive adjustments.

        You can modify the style block within index.html to change fonts, colors, spacing, and overall card appearance.

    Themes:

        The themes object in the JavaScript section (<script>) defines the color schemes. You can add more themes by extending this object with new bgColor, textColor, companyColor, etc., properties.

    PDF Layout:

        The PDF generation logic within the generatePdfBtn event listener handles precise positioning.

        trimWidthInches, trimHeightInches, and bleedAmount define the card dimensions and print-ready margins. Adjust these if you need different card sizes or bleed specifications.

        PX_TO_INCH is used to convert pixel-based preview measurements to inches for PDF.

        The addFrontContent and addBackContent functions control the placement of text and images on each side. Fine-tune the yPos increments and x coordinates for more precise adjustments.

Dependencies

    Tailwind CSS CDN

    Google Fonts (Inter)

    jsPDF Library

Contribution

Feel free to fork this repository, make improvements, and submit pull requests.
License

[Specify your license here, e.g., MIT License]