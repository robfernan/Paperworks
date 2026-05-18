Resume Generator

This is a simple, offline-first Resume Generator built entirely with HTML, CSS, and JavaScript. It allows users to quickly input their personal information, experience, education, skills, and projects, and then generate a professional-looking PDF resume.
Features

    Offline Functionality: Runs directly in your web browser without needing an internet connection (after initial load of jsPDF library).

    Dynamic Sections: Easily add multiple entries for Experience, Education, and Projects.

    Remove Entries: Convenient "Remove" buttons allow you to delete individual entries from dynamic sections.

    Theme Selection: Choose from several predefined themes (Modern, Classic, Business Blue, Matrix-Inspired, Formal) or select a custom accent color to personalize your resume's appearance.

    Live Preview: See a real-time preview of your resume directly on the page as you fill out the form, ensuring the layout and content look as expected before PDF generation.

    Local Storage Persistence: All your input data is automatically saved to your browser's local storage, so you won't lose your progress if you close the tab or refresh the page. Your data will be there when you revisit the generator.

    Clear Form Option: A dedicated button to quickly clear all entered data.

    PDF Generation: Generates a clean, printable PDF document using the jsPDF library.

    Hyperlinked URLs: LinkedIn, Portfolio, and Project URLs are clickable in the generated PDF.

How to Use

    Download: Save the index.html file to your computer.

    Open in Browser: Open the index.html file using any modern web browser (e.g., Chrome, Firefox, Edge, Safari).

    Fill Out the Form: Enter your personal details, summary, experience, education, skills, and projects in the respective sections.

        Use the "Add More" buttons to add additional experience, education, or project entries.

        Use the "Remove" buttons to delete specific entries.

    Choose a Theme: Select one of the predefined themes or pick a custom accent color using the color picker.

    Live Preview: Click the "Show Live Preview" button to see how your resume will look. The preview will update as you type.

    Generate PDF: Once you are satisfied with the preview, click the "Generate Resume PDF" button. Your browser will download the generated resume as a PDF file.

    Clear Data (Optional): If you want to start fresh, click the "Clear Form" button. This will erase all data from your browser's local storage for this application.

Technologies Used

    HTML5: For the structure of the web page.

    CSS3: For styling and responsiveness.

    JavaScript (ES6+): For dynamic functionality, form handling, local storage, and PDF generation logic.

    jsPDF Library: A client-side JavaScript library used to generate PDF documents. (Loaded via CDN: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js)

Customization

You can easily customize this resume generator by editing the index.html file:

    Themes: Modify the getThemeSettings() JavaScript function to adjust font sizes, colors, and line styles for existing themes, or add entirely new themes.

    Sections: Add or remove input fields and sections by editing the HTML structure and updating the saveFormData(), loadFormData(), and renderPreview() JavaScript functions accordingly.

    Styling: Adjust the CSS within the <style> tags to change the overall look and feel of the form and the live preview.

Known Issues / Limitations

    Advanced text formatting (e.g., bolding specific words within descriptions) is not supported in the PDF output beyond what jsPDF offers for basic text.

    Reordering of dynamically added Experience, Education, or Project entries is not currently supported (they appear in the order they were added).

    The live preview is a close approximation but may not be pixel-perfect identical to the final PDF due to differences in browser rendering vs. jsPDF.

Potential Future Enhancements

    Ability to reorder dynamic sections (Experience, Education, Projects).

    Support for basic rich text editing (bold, italic) within description fields.

    Option to add more specialized sections like 'Awards & Honors' or 'Certifications'.

    Integration with a backend for saving/loading resumes to a database (currently uses local storage).

Contact / Support

For questions, feedback, or bug reports, please [mention your preferred contact method, e.g., open an issue on GitHub, email address, etc.].

Feel free to use and modify this Resume Generator for your personal needs!