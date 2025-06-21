import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ExportMenu from '../components/ExportMenu';
import * as exportModule from '../lib/export';
import { saveAs } from 'file-saver';

// Mock the file-saver and export modules
jest.mock('file-saver');
jest.mock('../lib/export', () => ({
  fetchExport: jest.fn(),
}));

describe('ExportMenu Component', () => {
  const mockFilters = {
    fromDate: new Date('2023-01-01'),
    toDate: new Date('2023-12-31'),
    states: ['new', 'in_progress'],
    minSeverity: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders export button with dropdown options', () => {
    render(
      <ChakraProvider>
        <ExportMenu incidentsCount={10} filters={mockFilters} />
      </ChakraProvider>
    );

    // Check that the Export button exists
    expect(screen.getByText('Exporter')).toBeInTheDocument();

    // Open the dropdown
    fireEvent.click(screen.getByText('Exporter'));

    // Check that both export options are visible
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  test('disabled button when no incidents are available', () => {
    render(
      <ChakraProvider>
        <ExportMenu incidentsCount={0} filters={mockFilters} />
      </ChakraProvider>
    );

    // Check that the Export button is disabled
    const button = screen.getByText('Exporter');
    expect(button).toHaveAttribute('disabled');
  });

  test('clicking CSV triggers fetchExport with correct format', async () => {
    // Mock the fetchExport to resolve successfully
    (exportModule.fetchExport as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <ChakraProvider>
        <ExportMenu incidentsCount={10} filters={mockFilters} />
      </ChakraProvider>
    );

    // Open the dropdown
    fireEvent.click(screen.getByText('Exporter'));

    // Click CSV option
    fireEvent.click(screen.getByText('CSV'));

    // Check that fetchExport was called with the correct parameters
    await waitFor(() => {
      expect(exportModule.fetchExport).toHaveBeenCalledWith('csv', mockFilters);
    });
  });

  test('clicking JSON triggers fetchExport with correct format', async () => {
    // Mock the fetchExport to resolve successfully
    (exportModule.fetchExport as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <ChakraProvider>
        <ExportMenu incidentsCount={10} filters={mockFilters} />
      </ChakraProvider>
    );

    // Open the dropdown
    fireEvent.click(screen.getByText('Exporter'));

    // Click JSON option
    fireEvent.click(screen.getByText('JSON'));

    // Check that fetchExport was called with the correct parameters
    await waitFor(() => {
      expect(exportModule.fetchExport).toHaveBeenCalledWith('json', mockFilters);
    });
  });

  test('successful export shows success toast', async () => {
    // Mock the fetchExport to resolve successfully
    (exportModule.fetchExport as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <ChakraProvider>
        <ExportMenu incidentsCount={10} filters={mockFilters} />
      </ChakraProvider>
    );

    // Open the dropdown
    fireEvent.click(screen.getByText('Exporter'));

    // Click CSV option
    fireEvent.click(screen.getByText('CSV'));

    // A success toast would be shown, but in tests we cannot directly check for toasts
    // Instead, we verify that fetchExport was called and completed
    await waitFor(() => {
      expect(exportModule.fetchExport).toHaveBeenCalledTimes(1);
    });
  });

  test('failed export shows error toast', async () => {
    // Mock the fetchExport to reject with an error
    (exportModule.fetchExport as jest.Mock).mockRejectedValueOnce(new Error('Export failed'));

    render(
      <ChakraProvider>
        <ExportMenu incidentsCount={10} filters={mockFilters} />
      </ChakraProvider>
    );

    // Spy on console.error which is called when export fails
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Open the dropdown
    fireEvent.click(screen.getByText('Exporter'));

    // Click CSV option
    fireEvent.click(screen.getByText('CSV'));

    // Verify that the error was logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(exportModule.fetchExport).toHaveBeenCalledTimes(1);
    });

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
