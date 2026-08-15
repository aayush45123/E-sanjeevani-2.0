import React from "react";
import styles from "./Skeleton.module.css";

export function Skeleton({
  variant = "rect",
  width,
  height,
  className = "",
  style = {},
  children,
  ...props
}) {
  const variantClass = styles[variant] || styles.rect;
  const computedStyle = {
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...style,
  };

  return (
    <div
      className={`${styles.skeletonBase} ${variantClass} ${className}`}
      style={computedStyle}
      {...props}
    >
      {children}
    </div>
  );
}

export function SkeletonText({ width = "100%", height = "1rem", className = "", ...props }) {
  return <Skeleton variant="text" width={width} height={height} className={className} {...props} />;
}

export function SkeletonAvatar({ size = "40px", className = "", ...props }) {
  return <Skeleton variant="circle" width={size} height={size} className={className} {...props} />;
}

export function SkeletonButton({ width = "120px", height = "38px", className = "", ...props }) {
  return <Skeleton variant="button" width={width} height={height} className={className} {...props} />;
}

export function SkeletonPill({ width = "80px", height = "26px", className = "", ...props }) {
  return <Skeleton variant="pill" width={width} height={height} className={className} {...props} />;
}

export function SkeletonRect({ width = "100%", height = "120px", className = "", ...props }) {
  return <Skeleton variant="rect" width={width} height={height} className={className} {...props} />;
}

export function SidebarSkeleton() {
  return (
    <aside className={styles.sidebarSkeleton}>
      <Skeleton width="140px" height="32px" style={{ borderRadius: "8px" }} />
      <div className={styles.sidebarNavList}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className={styles.sidebarNavItem} />
        ))}
      </div>
      <div className={styles.sidebarFooter}>
        <SkeletonAvatar size="36px" />
        <div style={{ flex: 1 }}>
          <SkeletonText width="80%" height="0.85rem" />
          <SkeletonText width="50%" height="0.7rem" />
        </div>
      </div>
    </aside>
  );
}
