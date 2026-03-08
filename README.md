# ViBoot-Enhanced - Experience VTOP Like Never Before

## Getting Started

Welcome to ViBoot-Enhanced! This browser extension helps you have a better experience with VTOP in one click. Whether you're tracking grades or managing your schedule, you'll enjoy a smoother interface.

Works on **Google Chrome** and **Mozilla Firefox**.

## Download & Install

### Google Chrome

1. Go to the [Releases page](https://github.com/rabbive/ViBoot-Enhanced/releases/latest) and download the latest `.zip` file.
2. Extract the ZIP file to a folder on your computer.
3. Open Chrome and go to `chrome://extensions`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** and select the extracted folder.
6. The extension icon will appear in the toolbar. Click it to get started.

### Mozilla Firefox

1. Go to the [Releases page](https://github.com/rabbive/ViBoot-Enhanced/releases/latest) and download the latest `.xpi` file.
2. Open Firefox, drag the `.xpi` file into a Firefox window, or go to `about:addons`, click the gear icon, and select **Install Add-on From File...**.
3. The extension icon will appear in the toolbar.

> **Note:** Unsigned `.xpi` files can only be installed in Firefox Developer Edition or Nightly (with `xpinstall.signatures.required` set to `false` in `about:config`). For regular Firefox, the extension needs to be signed via [addons.mozilla.org](https://addons.mozilla.org/).

> **Note:** Google Calendar sync features are not available in Firefox due to browser limitations with the Google Identity API.

## Features

### Attendance Page
- **75% Attendance Alert**: Automatically calculates and shows how many classes you can skip or need to attend to maintain 75% attendance for each course.
- **Attendance Summary Table**: Displays total classes, attended classes, unattended classes, overall attendance percentage, and how many classes can be skipped at various thresholds (95%, 90%, 85%, 80%, 75%).
- **Lab-aware calculations**: Adjusts calculations for lab sessions (counted as 2 hours).
- **Color-coded indicators**: Green for safe (>75%), yellow for caution (74.01%-74.99%), red for below 75%.

### On Duty (OD) Tracker
- **Check OD Button**: One-click scan across all courses to find On Duty attendance entries.
- **OD Summary Table**: Displays all OD entries sorted by date with course code, slot, day/time, and OD count.
- **Total OD Count**: Shows cumulative OD count with a warning that it includes all types (SWC, School, CDC, etc.).
- **Course-Wise OD Summary**: Break down OD counts by individual course to see which courses have the most ODs.

### Marks Page
- **Totals Row**: Automatically adds a summary row to each course showing total max marks, total weightage, total scored, total weightage equivalent, and lost weightage marks.
- **FAT Passing Marks Calculator**: Calculates and displays the minimum marks needed in FAT to pass each course, with green/red indicators.
- **Supports all course types**: Theory, Lab, Online, and Soft Skills (STS) courses.

### Course Page
- **One-click PDF Downloads**: Download course materials directly with organized folder structure.
- **Module-wise Toggle**: Choose to download files organized by module or flat.
- **Download All / Download Selected**: Bulk download buttons for course materials.
- **Smart file naming**: Files are saved with descriptive names based on lecture topics and dates.

### Navigation Shortcuts
- **Quick-access Navbar Buttons**: Adds shortcut buttons for Attendance, Marks, Calendar, Course Page, and Time Table directly to the VTOP navbar.
- **VTOPCC Support**: Separate navbar shortcuts for vtopcc.vit.ac.in with Marks View, Class Attendance, Course Page, DA Upload, Time Table, and Academic Calendar.

### Captcha Auto-Solve
- **Automatic captcha filling**: Uses bitmap matching and neural network to automatically solve VTOP login captchas.
- **Works on both VTOP portals**: Supports vtop.vit.ac.in and vtopcc.vit.ac.in captcha formats.

### Exam Schedule Sync (Chrome only)
- **Google Calendar Integration**: Sync exam dates, venues, and seat locations directly to your Google Calendar.
- **Per-exam-type sync**: Choose which exam type (CAT, FAT, etc.) to sync.

### Time Table Sync (Chrome only)
- **Weekly schedule sync**: Sync your entire weekly time table to Google Calendar with recurring events.
- **Custom date range**: Choose how far ahead to sync your schedule.
- **Slot-aware timing**: Automatically maps VIT time slots to correct times and days.

### Smart Downloads (Chrome only)
- **Organized folder structure**: Downloads are automatically organized into `VIT Downloads/[Course]/[Faculty-Slot]/[Module]/` folders.
- **Supports all download types**: Course materials, assignments (question papers and submissions), and syllabi.

## Browser Compatibility

| Feature | Chrome | Firefox |
|---------|--------|---------|
| Attendance Calculator | Yes | Yes |
| OD Tracker | Yes | Yes |
| Marks Summary | Yes | Yes |
| Course Downloads | Yes | Yes |
| Navigation Shortcuts | Yes | Yes |
| Captcha Auto-Solve | Yes | Yes |
| Exam Schedule Sync | Yes | No |
| Time Table Sync | Yes | No |
| Smart Download Folders | Yes | No |

## FAQ

### What is VTOP?

VTOP is a web application used by students at VIT universities (Vellore, Chennai, Bhopal) to manage academic records and schedules.

### What are the system requirements?

- **Operating System**: Windows, macOS, or Linux.
- **Browser**: Latest version of Google Chrome or Mozilla Firefox.

### Can I contribute?

Yes! We welcome contributions. Visit the [GitHub repository](https://github.com/rabbive/ViBoot-Enhanced) for more information.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/rabbive/ViBoot-Enhanced/issues) in the GitHub repository.

## Credits

Enhanced by [Ashwanth Kumaravel](https://github.com/rabbive).

Originally built by the [ViTrendz](https://vitrendz.com/) team.
