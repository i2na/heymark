import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMarkdownFiles } from "@/utils/markdown";
import { isAuthenticated, getUserInfo, startGoogleLogin, clearAuth } from "@/utils/auth";
import { GoRepo, GoLock } from "react-icons/go";
import type { MarkdownFile } from "@/types";
import styles from "./ListPage.module.scss";

export function ListPage() {
    const navigate = useNavigate();
    const [authenticated, setAuthenticated] = useState(isAuthenticated());
    const [user, setUser] = useState(getUserInfo());
    const [files, setFiles] = useState<MarkdownFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [brandName, setBrandName] = useState("@heymark");

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch("/custom/config.json");
                const config = await response.json();
                if (config.brandName) {
                    setBrandName(config.brandName);
                }
            } catch (error) {
                // 기본값 유지
            }
        };
        loadConfig();
    }, []);

    useEffect(() => {
        const checkAuth = () => {
            setAuthenticated(isAuthenticated());
            setUser(getUserInfo());
        };

        checkAuth();
        window.addEventListener("focus", checkAuth);

        return () => {
            window.removeEventListener("focus", checkAuth);
        };
    }, []);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            const userEmail = user?.email || null;
            const posts = await getMarkdownFiles(userEmail);
            setFiles(posts);
            setLoading(false);
        };

        fetchPosts();
    }, [user]);

    const handleFileClick = (filename: string) => {
        const baseFilename = filename.replace(".md", "");
        navigate(`/${baseFilename}`);
    };

    const handleLogin = () => {
        startGoogleLogin("/");
    };

    const handleLogout = () => {
        clearAuth();
        setAuthenticated(false);
        setUser(null);
        window.location.reload();
    };

    return (
        <div className={styles.listPage}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{brandName}</h1>

                    {authenticated && user ? (
                        <div className={styles.userInfo}>
                            <span className={styles.userEmail}>{user.email}</span>
                            <button className={styles.logoutButton} onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button className={styles.loginButton} onClick={handleLogin}>
                            Login
                        </button>
                    )}
                </div>

                <div className={styles.list}>
                    {loading ? (
                        <div className={styles.loading}>
                            <span></span>
                        </div>
                    ) : files.length === 0 ? (
                        <div className={styles.empty}>게시물이 없습니다</div>
                    ) : (
                        files.map((file) => (
                            <div
                                key={file.filename}
                                className={styles.item}
                                onClick={() => handleFileClick(file.filename)}
                            >
                                <div className={styles.itemMain}>
                                    <div className={styles.itemTitleRow}>
                                        <GoRepo className={styles.repoIcon} />
                                        <h2 className={styles.itemTitle} title={file.title}>
                                            {file.title}
                                        </h2>
                                        {file.metadata.visibility === "private" && (
                                            <span className={styles.sharedBadge}>
                                                <GoLock size={12} />
                                                <span className={styles.badgeText}>Shared</span>
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.itemMeta}>
                                        {file.metadata.createdAt && (
                                            <span className={styles.date}>
                                                {file.metadata.createdAt}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
