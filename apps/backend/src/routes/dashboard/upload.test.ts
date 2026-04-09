import { afterEach, describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

// Mock auth middleware
vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set("user", { id: "user-1" });
        c.set("session", { activeOrganizationId: "org-1" });
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
}));

import { uploadRouter } from "./upload";
const createUploadApp = (db: any, env: any = {}) =>
    createTestApp(uploadRouter, "/api/dashboard/upload", db);

describe("upload routes", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    const mockEnv = {
        CLOUDINARY_CLOUD_NAME: "test-cloud",
        CLOUDINARY_UPLOAD_PRESET: "test-preset",
    };

    describe("POST /image", () => {
        it("uploads image successfully", async () => {
            const db = createDbMock({});
            const app = createUploadApp(db, mockEnv);

            // Mock fetch for Cloudinary
            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    secure_url: "https://res.cloudinary.com/test/image/upload/v123/test.jpg",
                    public_id: "test-folder/image",
                    width: 800,
                    height: 600,
                    format: "jpg",
                    bytes: 12345,
                }),
            });

            const res = await app.request("/api/dashboard/upload/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
                    folder: "products",
                }),
            });
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.url).toContain("cloudinary.com");
            expect(body.data.width).toBe(800);
            expect(body.data.height).toBe(600);
        });

        it("rejects missing image data", async () => {
            const db = createDbMock({});
            const app = createUploadApp(db, mockEnv);

            const res = await app.request("/api/dashboard/upload/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ folder: "products" }),
            });
            const body = await res.json();

            expect(res.status).toBe(400);
            expect(body.success).toBe(false);
            expect(body.error.message).toContain("Image data is required");
        });

        it("rejects invalid image format", async () => {
            const db = createDbMock({});
            const app = createUploadApp(db, mockEnv);

            const res = await app.request("/api/dashboard/upload/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: "not-a-valid-data-uri",
                    folder: "products",
                }),
            });
            const body = await res.json();

            expect(res.status).toBe(400);
            expect(body.success).toBe(false);
            expect(body.error.message).toContain("Invalid image format");
        });

        it("handles Cloudinary upload error", async () => {
            const db = createDbMock({});
            const app = createUploadApp(db, mockEnv);

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                text: async () => "Upload failed",
            });

            const res = await app.request("/api/dashboard/upload/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
                }),
            });
            const body = await res.json();

            expect(res.status).toBe(500);
            expect(body.success).toBe(false);
        });

        it("phase 2.1: hides internal error details on unexpected failures", async () => {
            const db = createDbMock({});
            const app = createUploadApp(db, mockEnv);

            global.fetch = vi.fn().mockRejectedValueOnce(new Error("sensitive-upload-error"));

            const res = await app.request(
                "/api/dashboard/upload/image",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
                    }),
                },
                mockEnv as any
            );
            const body = await res.json();

            expect(res.status).toBe(500);
            expect(body.success).toBe(false);
            expect(body.error.code).toBe("INTERNAL_ERROR");
            expect(body.error.message).toBe("Internal server error");
        });
    });

    describe("POST /multiple", () => {
        it("uploads multiple images successfully", async () => {
            const db = createDbMock({});
            const app = createUploadApp(db, mockEnv);

            global.fetch = vi.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        secure_url: "https://res.cloudinary.com/test/image1.jpg",
                        public_id: "test/image1",
                        width: 800,
                        height: 600,
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        secure_url: "https://res.cloudinary.com/test/image2.jpg",
                        public_id: "test/image2",
                        width: 800,
                        height: 600,
                    }),
                });

            const res = await app.request("/api/dashboard/upload/multiple", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    images: [
                        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
                        "data:image/png;base64,iVBORw0KGgoAAAANS...",
                    ],
                    folder: "products",
                }),
            });
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.images).toHaveLength(2);
        });

        it("rejects too many images", async () => {
            const db = createDbMock({});
            const app = createUploadApp(db, mockEnv);

            const res = await app.request("/api/dashboard/upload/multiple", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    images: Array(6).fill("data:image/jpeg;base64,/9j..."),
                }),
            });
            const body = await res.json();

            expect(res.status).toBe(400);
            expect(body.success).toBe(false);
            expect(body.error.message).toContain("1-5 images");
        });

        it("rejects empty images array", async () => {
            const db = createDbMock({});
            const app = createUploadApp(db, mockEnv);

            const res = await app.request("/api/dashboard/upload/multiple", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ images: [] }),
            });
            const body = await res.json();

            expect(res.status).toBe(400);
            expect(body.success).toBe(false);
        });

        it("phase 2.1: rejects invalid image format in multiple upload", async () => {
            const db = createDbMock({});
            const app = createUploadApp(db, mockEnv);

            const res = await app.request("/api/dashboard/upload/multiple", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    images: ["not-a-valid-data-uri"],
                }),
            });
            const body = await res.json();

            expect(res.status).toBe(400);
            expect(body.success).toBe(false);
            expect(body.error.code).toBe("BAD_REQUEST");
        });
    });

    describe("DELETE /image", () => {
        it("returns not implemented message", async () => {
            const db = createDbMock({});
            const app = createUploadApp(db, mockEnv);

            const res = await app.request("/api/dashboard/upload/image", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicId: "test/image" }),
            });
            const body = await res.json();

            expect(res.status).toBe(400);
            expect(body.success).toBe(false);
            expect(body.error.message).toContain("not implemented");
        });
    });
});
