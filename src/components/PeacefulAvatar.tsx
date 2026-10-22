interface PeacefulAvatarProps {
  visible: boolean;
  turningAway: boolean;
}

export function PeacefulAvatar({ visible, turningAway }: PeacefulAvatarProps) {
  return (
    <div className={`peaceful-avatar ${visible ? 'is-visible' : ''} ${turningAway ? 'is-turning' : ''}`} aria-hidden="true">
      <div className="peaceful-halo" />
      <div className="avatar-silhouette">
        <div className="avatar-hair avatar-hair-back" />
        <div className="avatar-head"><div className="avatar-hair avatar-hair-cap" /></div>
        <div className="avatar-neck" />
        <div className="avatar-shoulders" />
        <div className="avatar-dress" />
        <div className="avatar-hair avatar-hair-front" />
      </div>
      <div className="quiet-ground-reflection" />
      <div className="quiet-drift quiet-drift-one" />
      <div className="quiet-drift quiet-drift-two" />
      <div className="quiet-drift quiet-drift-three" />
    </div>
  );
}