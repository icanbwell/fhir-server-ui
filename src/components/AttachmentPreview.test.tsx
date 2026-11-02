import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AttachmentPreview from './AttachmentPreview';

// EnvironmentContext.ts fires a real FhirApi.getVersion() network call at module-import
// time; this hoisted mock (scoped to this test file only — see DocumentViewer.test.tsx for
// the same pattern) neutralizes it so it resolves harmlessly instead of throwing in jsdom.
vi.mock('../api/fhirApi', () => ({
    default: class {
        getVersion() {
            return Promise.resolve('4.0.0');
        }
    },
}));

describe('AttachmentPreview', () => {
    it('renders a native <video> element with controls for a video attachment', async () => {
        const { container } = render(
            <AttachmentPreview attachment={{ contentType: 'video/mp4', data: 'aGVsbG8=', title: 'Clip' }} />
        );

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const video = container.querySelector('video');
        expect(video).not.toBeNull();
        expect(video).toHaveAttribute('controls');
        expect(video?.getAttribute('src')).toMatch(/^blob:/);
    });

    it('renders a native <audio> element with controls for an audio attachment', async () => {
        const { container } = render(
            <AttachmentPreview attachment={{ contentType: 'audio/mpeg', data: 'aGVsbG8=', title: 'Recording' }} />
        );

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const audio = container.querySelector('audio');
        expect(audio).not.toBeNull();
        expect(audio).toHaveAttribute('controls');
        expect(audio?.getAttribute('src')).toMatch(/^blob:/);
    });

    it('replaces the <video> element with a warning when the browser cannot play it', async () => {
        const { container } = render(
            <AttachmentPreview attachment={{ contentType: 'video/mp4', data: 'aGVsbG8=', title: 'Clip' }} />
        );

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const video = container.querySelector('video');
        expect(video).not.toBeNull();
        fireEvent.error(video!);

        expect(await screen.findByText(/use download instead/i)).toBeInTheDocument();
        expect(container.querySelector('video')).toBeNull();
    });

    it('replaces the <img> element with a warning when the browser cannot display it', async () => {
        // Only Safari decodes TIFF in an <img>, so in Chrome, Edge and Firefox a TIFF attachment used to render as a
        // blank area with no hint that Download still works.
        const { container } = render(
            <AttachmentPreview attachment={{ contentType: 'image/tiff', data: 'SUkqAA==', title: 'Slide' }} />
        );

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const image = container.querySelector('img');
        expect(image).not.toBeNull();
        fireEvent.error(image!);

        expect(await screen.findByText(/cannot display this image\/tiff image — use download instead/i)).toBeInTheDocument();
        expect(container.querySelector('img')).toBeNull();
    });

    it('replaces the <audio> element with a warning when the browser cannot play it', async () => {
        const { container } = render(
            <AttachmentPreview attachment={{ contentType: 'audio/mpeg', data: 'aGVsbG8=', title: 'Recording' }} />
        );

        await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());

        const audio = container.querySelector('audio');
        expect(audio).not.toBeNull();
        fireEvent.error(audio!);

        expect(await screen.findByText(/use download instead/i)).toBeInTheDocument();
        expect(container.querySelector('audio')).toBeNull();
    });
});
